import type { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import express from 'express';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { GHLConfig } from './types/ghl-types.js';
import { EnhancedGHLClient } from './enhanced-ghl-client.js';
import { extractBearerToken } from './http-auth.js';

type StoredAuthorizationCode = {
  clientId: string;
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  payload: ByoGhlTokenPayload;
  expiresAt: number;
};

export type ByoGhlTokenPayload = GHLConfig & {
  iat: number;
  exp: number;
};

export type ByoGhlOAuthOptions = {
  baseConfig: GHLConfig;
  publicBaseUrl?: string;
  secret: string;
  tokenTtlSeconds?: number;
};

export type RequestWithGhlConfig = Request & {
  ghlConfig?: GHLConfig;
};

const DEFAULT_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const AUTH_CODE_TTL_MS = 10 * 60 * 1000;
const codes = new Map<string, StoredAuthorizationCode>();

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function getPublicBaseUrl(req: Request, configured?: string): string {
  if (configured) return configured.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] || req.protocol || 'https';
  return `${proto}://${req.get('host')}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sealByoGhlToken(payload: ByoGhlTokenPayload, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `bghl.${base64Url(iv)}.${base64Url(tag)}.${base64Url(encrypted)}`;
}

export function unsealByoGhlToken(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): ByoGhlTokenPayload {
  const [prefix, ivPart, tagPart, encryptedPart] = token.split('.');
  if (prefix !== 'bghl' || !ivPart || !tagPart || !encryptedPart) {
    throw new Error('Invalid BYO GHL token format');
  }

  const decipher = createDecipheriv('aes-256-gcm', deriveKey(secret), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64url')),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString('utf8')) as ByoGhlTokenPayload;
  if (!payload.accessToken || !payload.locationId || !payload.baseUrl || !payload.version) {
    throw new Error('Invalid BYO GHL token payload');
  }
  if (payload.exp <= nowSeconds) {
    throw new Error('BYO GHL token expired');
  }
  return payload;
}

export function verifyPkce(codeVerifier: string | undefined, codeChallenge?: string, method?: string): boolean {
  if (!codeChallenge) return true;
  if (!codeVerifier) return false;
  if ((method || 'plain') === 'S256') {
    return safeEqual(base64Url(createHash('sha256').update(codeVerifier).digest()), codeChallenge);
  }
  return safeEqual(codeVerifier, codeChallenge);
}

function cleanupCodes(): void {
  const now = Date.now();
  for (const [code, record] of codes) {
    if (record.expiresAt <= now) codes.delete(code);
  }
}

function metadata(baseUrl: string) {
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256', 'plain'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['ghl:read', 'ghl:write'],
  };
}

function protectedResourceMetadata(baseUrl: string) {
  return {
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ['ghl:read', 'ghl:write'],
    bearer_methods_supported: ['header'],
  };
}

function renderAuthorizeForm(params: URLSearchParams, error?: string): string {
  const hidden = Array.from(params.entries())
    .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connect GoHighLevel MCP</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: #f7f7f5; color: #161616; }
    main { max-width: 520px; margin: 9vh auto; padding: 32px; background: #fff; border: 1px solid #ddd; border-radius: 8px; }
    h1 { font-size: 24px; margin: 0 0 8px; }
    p { color: #555; line-height: 1.5; }
    label { display: block; font-weight: 650; margin-top: 18px; }
    input { width: 100%; box-sizing: border-box; margin-top: 6px; padding: 11px 12px; border: 1px solid #bbb; border-radius: 6px; font-size: 15px; }
    button { margin-top: 24px; width: 100%; padding: 12px 14px; border: 0; border-radius: 6px; background: #111; color: #fff; font-weight: 700; font-size: 15px; cursor: pointer; }
    .error { border: 1px solid #e3a1a1; background: #fff1f1; color: #8b1d1d; padding: 10px 12px; border-radius: 6px; }
    .fine { font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <main>
    <h1>Connect GoHighLevel MCP</h1>
    <p>Enter your own HighLevel private integration token and Location ID. They are encrypted into the access token Claude receives for this connector.</p>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
    <form method="post" action="/oauth/authorize">
      ${hidden}
      <label for="ghl_api_key">HighLevel API token</label>
      <input id="ghl_api_key" name="ghl_api_key" type="password" required autocomplete="off">

      <label for="ghl_location_id">HighLevel Location ID</label>
      <input id="ghl_location_id" name="ghl_location_id" type="text" required autocomplete="off">

      <button type="submit">Authorize connector</button>
    </form>
    <p class="fine">Use a token scoped for the sub-account you want Claude to access.</p>
  </main>
</body>
</html>`;
}

export function createByoGhlOAuthRouter(options: ByoGhlOAuthOptions): Router {
  const router = express.Router();

  router.get('/.well-known/oauth-authorization-server', (req, res) => {
    res.json(metadata(getPublicBaseUrl(req, options.publicBaseUrl)));
  });

  router.get('/.well-known/openid-configuration', (req, res) => {
    res.json(metadata(getPublicBaseUrl(req, options.publicBaseUrl)));
  });

  router.get('/.well-known/oauth-protected-resource', (req, res) => {
    res.json(protectedResourceMetadata(getPublicBaseUrl(req, options.publicBaseUrl)));
  });

  router.post('/oauth/register', (req, res) => {
    const clientId = `claude-${randomBytes(12).toString('hex')}`;
    res.status(201).json({
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: req.body?.redirect_uris ?? [],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    });
  });

  router.get('/oauth/authorize', (req, res) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') params.set(key, value);
    }
    res.type('html').send(renderAuthorizeForm(params));
  });

  router.post('/oauth/authorize', async (req, res) => {
    cleanupCodes();
    const redirectUri = String(req.body.redirect_uri || '');
    const state = String(req.body.state || '');
    const clientId = String(req.body.client_id || 'dynamic-client');
    const responseType = String(req.body.response_type || '');
    const codeChallenge = req.body.code_challenge ? String(req.body.code_challenge) : undefined;
    const codeChallengeMethod = req.body.code_challenge_method ? String(req.body.code_challenge_method) : undefined;
    const accessToken = String(req.body.ghl_api_key || '');
    const locationId = String(req.body.ghl_location_id || '');

    if (responseType && responseType !== 'code') {
      res.status(400).type('html').send(renderAuthorizeForm(new URLSearchParams(req.body), 'Unsupported OAuth response type.'));
      return;
    }
    if (!redirectUri || !accessToken || !locationId) {
      res.status(400).type('html').send(renderAuthorizeForm(new URLSearchParams(req.body), 'Missing redirect URI, token, or Location ID.'));
      return;
    }

    const config: GHLConfig = {
      ...options.baseConfig,
      accessToken,
      locationId,
    };

    try {
      await new EnhancedGHLClient(config).testConnection();
    } catch (error) {
      res.status(400).type('html').send(renderAuthorizeForm(new URLSearchParams(req.body), `HighLevel auth check failed: ${error instanceof Error ? error.message : String(error)}`));
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const code = randomBytes(24).toString('base64url');
    codes.set(code, {
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      payload: {
        ...config,
        iat: nowSeconds,
        exp: nowSeconds + (options.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS),
      },
      expiresAt: Date.now() + AUTH_CODE_TTL_MS,
    });

    const redirect = new URL(redirectUri);
    redirect.searchParams.set('code', code);
    if (state) redirect.searchParams.set('state', state);
    res.redirect(302, redirect.toString());
  });

  router.post('/oauth/token', (req, res) => {
    cleanupCodes();
    const grantType = String(req.body.grant_type || '');
    const code = String(req.body.code || '');
    const redirectUri = String(req.body.redirect_uri || '');
    const codeVerifier = req.body.code_verifier ? String(req.body.code_verifier) : undefined;

    if (grantType !== 'authorization_code') {
      res.status(400).json({ error: 'unsupported_grant_type' });
      return;
    }

    const record = codes.get(code);
    if (!record || record.redirectUri !== redirectUri) {
      res.status(400).json({ error: 'invalid_grant' });
      return;
    }

    if (!verifyPkce(codeVerifier, record.codeChallenge, record.codeChallengeMethod)) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      return;
    }

    codes.delete(code);
    const accessToken = sealByoGhlToken(record.payload, options.secret);
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: Math.max(0, record.payload.exp - Math.floor(Date.now() / 1000)),
      scope: 'ghl:read ghl:write',
    });
  });

  return router;
}

export function createByoGhlResourceMiddleware(options: ByoGhlOAuthOptions): RequestHandler {
  return (req: RequestWithGhlConfig, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS' || req.path === '/' || req.path === '/health') {
      next();
      return;
    }

    const token = extractBearerToken(req.get('authorization'));
    if (!token) {
      const baseUrl = getPublicBaseUrl(req, options.publicBaseUrl);
      res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource", scope="ghl:read ghl:write"`);
      res.status(401).json({ error: 'Authorization required' });
      return;
    }

    try {
      const payload = unsealByoGhlToken(token, options.secret);
      req.ghlConfig = {
        accessToken: payload.accessToken,
        locationId: payload.locationId,
        baseUrl: payload.baseUrl,
        version: payload.version,
      };
      next();
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
      res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid token' });
    }
  };
}
