import { createHttpAuthMiddleware, extractBearerToken, safeTokenEquals } from '../src/http-auth';

describe('HTTP auth middleware', () => {
  it('extracts bearer tokens case-insensitively', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
    expect(extractBearerToken('bearer abc123')).toBe('abc123');
    expect(extractBearerToken('Basic abc123')).toBeUndefined();
  });

  it('compares tokens safely', () => {
    expect(safeTokenEquals('secret', 'secret')).toBe(true);
    expect(safeTokenEquals('wrong', 'secret')).toBe(false);
    expect(safeTokenEquals(undefined, 'secret')).toBe(false);
  });

  it('does not require auth when no token is configured', () => {
    const middleware = createHttpAuthMiddleware({});
    const next = jest.fn();
    middleware(
      { method: 'POST', path: '/mcp', get: jest.fn() } as any,
      {} as any,
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows public health and root routes', () => {
    const middleware = createHttpAuthMiddleware({ token: 'secret' });
    const next = jest.fn();
    middleware(
      { method: 'GET', path: '/health', get: jest.fn() } as any,
      {} as any,
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects protected routes without a matching bearer token', () => {
    const middleware = createHttpAuthMiddleware({ token: 'secret' });
    const next = jest.fn();
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    middleware(
      { method: 'POST', path: '/mcp', get: jest.fn().mockReturnValue('Bearer wrong') } as any,
      res as any,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('allows protected routes with a matching bearer token', () => {
    const middleware = createHttpAuthMiddleware({ token: 'secret' });
    const next = jest.fn();
    middleware(
      { method: 'POST', path: '/mcp', get: jest.fn().mockReturnValue('Bearer secret') } as any,
      {} as any,
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
