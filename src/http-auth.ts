import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { timingSafeEqual } from 'crypto';

export type HttpAuthOptions = {
  token?: string;
  publicPaths?: string[];
};

export function extractBearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

export function safeTokenEquals(actual: string | undefined, expected: string): boolean {
  if (!actual) return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createHttpAuthMiddleware(options: HttpAuthOptions): RequestHandler {
  const expectedToken = options.token?.trim();
  const publicPaths = new Set(options.publicPaths ?? ['/', '/health']);

  return (req: Request, res: Response, next: NextFunction) => {
    if (!expectedToken || req.method === 'OPTIONS' || publicPaths.has(req.path)) {
      next();
      return;
    }

    const bearerToken = extractBearerToken(req.get('authorization'));
    if (safeTokenEquals(bearerToken, expectedToken)) {
      next();
      return;
    }

    res.setHeader('WWW-Authenticate', 'Bearer realm="ghl-mcp"');
    res.status(401).json({ error: 'Unauthorized' });
  };
}
