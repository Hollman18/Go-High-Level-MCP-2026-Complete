import { sealByoGhlToken, unsealByoGhlToken, verifyPkce } from '../src/byo-ghl-oauth';
import { createHash } from 'crypto';

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

describe('BYO GHL OAuth helpers', () => {
  const payload = {
    accessToken: 'ghl-token',
    locationId: 'loc-123',
    baseUrl: 'https://services.leadconnectorhq.com',
    version: '2023-02-21',
    iat: 100,
    exp: 200,
  };

  it('seals and unseals GHL credentials', () => {
    const token = sealByoGhlToken(payload, 'secret');
    expect(token).toMatch(/^bghl\./);
    expect(token).not.toContain(payload.accessToken);
    expect(unsealByoGhlToken(token, 'secret', 150)).toEqual(payload);
  });

  it('rejects expired sealed tokens', () => {
    const token = sealByoGhlToken(payload, 'secret');
    expect(() => unsealByoGhlToken(token, 'secret', 201)).toThrow('expired');
  });

  it('rejects tokens sealed with another secret', () => {
    const token = sealByoGhlToken(payload, 'secret');
    expect(() => unsealByoGhlToken(token, 'other-secret', 150)).toThrow();
  });

  it('verifies plain and S256 PKCE challenges', () => {
    const verifier = 'pkce-verifier';
    const s256Challenge = base64Url(createHash('sha256').update(verifier).digest());

    expect(verifyPkce(verifier, verifier, 'plain')).toBe(true);
    expect(verifyPkce(verifier, s256Challenge, 'S256')).toBe(true);
    expect(verifyPkce('wrong', s256Challenge, 'S256')).toBe(false);
  });
});
