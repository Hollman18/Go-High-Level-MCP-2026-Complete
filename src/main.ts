/**
 * GoHighLevel MCP Server
 *
 * Streamable HTTP transport with optional legacy SSE support.
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { EnhancedGHLClient } from './enhanced-ghl-client.js';
import { ToolRegistry } from './tool-registry.js';
import { GHLConfig } from './types/ghl-types.js';
import { registerExecuteRoutes } from './execute-route.js';
import { createHttpAuthMiddleware } from './http-auth.js';
import {
  RequestWithGhlConfig,
  createByoGhlOAuthRouter,
  createByoGhlResourceMiddleware,
} from './byo-ghl-oauth.js';

dotenv.config();

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;
  const out = level === 'error' ? process.stderr : process.stderr;
  out.write(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...(data || {}) }) + '\n');
}

function readConfig(requireCredentials = true): GHLConfig {
  const config: GHLConfig = {
    accessToken: process.env.GHL_API_KEY || '',
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2023-02-21',
    locationId: process.env.GHL_LOCATION_ID || '',
  };

  if (requireCredentials && !config.accessToken) throw new Error('GHL_API_KEY is required');
  if (requireCredentials && !config.locationId) throw new Error('GHL_LOCATION_ID is required');
  return config;
}

function createMcpServer(client: EnhancedGHLClient): McpServer {
  const server = new McpServer(
    { name: 'ghl-mcp-server', version: '2.0.0' },
    { capabilities: { tools: {} } }
  );
  new ToolRegistry(client).registerAll(server);
  return server;
}

async function main() {
  const port = parseInt(process.env.PORT || process.env.MCP_SERVER_PORT || '8000', 10);
  const authMode = process.env.MCP_AUTH_MODE || 'static';
  const isByoGhlOAuth = authMode === 'byo-ghl-oauth';
  const config = readConfig(!isByoGhlOAuth);
  const oauthSecret = process.env.MCP_OAUTH_SECRET || process.env.MCP_AUTH_TOKEN || '';
  if (isByoGhlOAuth && !oauthSecret) {
    throw new Error('MCP_OAUTH_SECRET or MCP_AUTH_TOKEN is required when MCP_AUTH_MODE=byo-ghl-oauth');
  }
  const ghlClient = new EnhancedGHLClient(config);
  const registry = new ToolRegistry(ghlClient);
  const toolCount = registry.getToolCount();
  const startTime = Date.now();

  log('info', 'Initializing GHL MCP server', {
    baseUrl: config.baseUrl,
    version: config.version,
    locationId: config.locationId,
    tools: toolCount,
    authMode,
  });

  if (!isByoGhlOAuth) {
    await ghlClient.testConnection();
  }

  const app = express();
  app.set('trust proxy', true);
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
          origin === 'https://chatgpt.com' ||
          origin === 'https://chat.openai.com') {
        return callback(null, true);
      }
      callback(new Error('CORS not allowed'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'mcp-session-id', 'x-ghl-access-token', 'x-ghl-location-id'],
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use((req, _res, next) => {
    log('debug', `${req.method} ${req.path}`, { ip: req.ip });
    next();
  });
  if (isByoGhlOAuth) {
    app.use(createByoGhlOAuthRouter({
      baseConfig: config,
      publicBaseUrl: process.env.MCP_PUBLIC_BASE_URL,
      secret: oauthSecret,
    }));
    app.use(createByoGhlResourceMiddleware({
      baseConfig: config,
      publicBaseUrl: process.env.MCP_PUBLIC_BASE_URL,
      secret: oauthSecret,
    }));
  } else if (!process.env.MCP_AUTH_TOKEN) {
    log('warn', 'MCP_AUTH_TOKEN is not set; HTTP MCP endpoints are unauthenticated');
  } else {
    app.use(createHttpAuthMiddleware({ token: process.env.MCP_AUTH_TOKEN }));
  }

  app.all('/mcp', async (req, res) => {
    try {
      const oauthConfig = (req as RequestWithGhlConfig).ghlConfig;
      const reqAccessToken = req.headers['x-ghl-access-token'] as string | undefined;
      const reqLocationId = req.headers['x-ghl-location-id'] as string | undefined;
      const client = oauthConfig
        ? new EnhancedGHLClient(oauthConfig)
        : (reqAccessToken && reqLocationId
          ? new EnhancedGHLClient({ ...config, accessToken: reqAccessToken, locationId: reqLocationId })
          : ghlClient);
      const requestServer = createMcpServer(client);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await requestServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        requestServer.close().catch(() => {});
      });
    } catch (err: any) {
      log('error', 'Streamable HTTP error', { error: err.message });
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  });

  const handleSSE = async (req: express.Request, res: express.Response) => {
    const sessionId = String(req.query.sessionId || 'unknown');
    log('info', 'SSE connection', { sessionId });

    try {
      const oauthConfig = (req as RequestWithGhlConfig).ghlConfig;
      const sseClient = oauthConfig ? new EnhancedGHLClient(oauthConfig) : ghlClient;
      const sseServer = createMcpServer(sseClient);
      const transport = new SSEServerTransport('/sse', res);
      await sseServer.connect(transport);
      req.on('close', () => {
        log('info', 'SSE connection closed', { sessionId });
        sseServer.close().catch(() => {});
      });
    } catch (err: any) {
      log('error', 'SSE error', { error: err.message, sessionId });
      if (!res.headersSent) res.status(500).json({ error: 'Failed to establish SSE connection' });
      else res.end();
    }
  };

  app.get('/sse', handleSSE);
  app.post('/sse', handleSSE);

  app.get('/', (_req, res) => {
    res.json({
      name: 'GoHighLevel MCP Server',
      version: '2.0.0',
      status: 'running',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      endpoints: {
        health: '/health',
        capabilities: '/capabilities',
        tools: '/tools',
        execute: '/execute',
        mcp: '/mcp',
        sse: '/sse',
      },
      tools: registry.getToolCounts(),
      cache: ghlClient.getCacheStats(),
    });
  });

  app.get('/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'healthy',
      server: 'ghl-mcp-server',
      version: '2.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      tools: toolCount,
      memory: {
        rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      },
      cache: ghlClient.getCacheStats(),
    });
  });

  app.get('/capabilities', (_req, res) => {
    res.json({
      capabilities: { tools: {} },
      server: { name: 'ghl-mcp-server', version: '2.0.0' },
      transport: ['streamable-http', 'sse'],
    });
  });

  registerExecuteRoutes(app, registry, config);

  app.get('/tool-inventory', (_req, res) => {
    res.json({
      tools: registry.getToolInventory(),
      count: registry.getToolCount(),
      generatedAt: new Date().toISOString(),
    });
  });

  app.post('/tools/call', async (req, res) => {
    const { name, arguments: args } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Missing tool name' });
      return;
    }

    try {
      const result = await registry.callTool(name, args || {});
      if (result === undefined) {
        res.status(404).json({ error: `Unknown tool: ${name}` });
        return;
      }
      res.json({ result });
    } catch (err: any) {
      log('error', `REST tool error: ${name}`, { error: err.message });
      res.status(500).json({ error: `Tool execution failed: ${err.message}` });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log('GoHighLevel MCP Server v2.0');
    console.log(`Server: http://0.0.0.0:${port}`);
    console.log(`Streamable HTTP: http://0.0.0.0:${port}/mcp`);
    console.log(`Legacy SSE: http://0.0.0.0:${port}/sse`);
    console.log(`Tools: ${toolCount}`);
  });

}

process.on('SIGINT', () => { log('info', 'Shutting down (SIGINT)'); process.exit(0); });
process.on('SIGTERM', () => { log('info', 'Shutting down (SIGTERM)'); process.exit(0); });

main().catch((err) => {
  log('error', 'Fatal error', { error: err.message, stack: err.stack });
  process.exit(1);
});
