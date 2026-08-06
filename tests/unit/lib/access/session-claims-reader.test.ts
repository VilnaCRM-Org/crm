import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { ROLES } from '@/lib/access/permission-catalog';
import sessionClaimsReader, { SessionClaimsReader } from '@/lib/access/session-claims-reader';
import {
  buildAccessToken,
  buildClaims,
  buildTenantRef,
  buildUserId,
  encodeSegment,
} from '@tests/builders';

const HEADER_SEGMENT = encodeSegment({ alg: 'none', typ: 'JWT' });
const SIGNATURE_SEGMENT = 'signature';
const BASE64_BLOCK = 4;
const CYRILLIC_TENANT_NAME = 'Вільна ЦРМ — Київ';

const NO_CLAIMS = {
  sub: undefined,
  email: undefined,
  roles: undefined,
  tenantId: undefined,
  tenants: undefined,
  flags: undefined,
};

const tokenWithPayload = (payload: string): string =>
  `${HEADER_SEGMENT}.${payload}.${SIGNATURE_SEGMENT}`;

describe('SessionClaimsReader', () => {
  const reader = new SessionClaimsReader();

  it('exports a shared singleton instance', () => {
    expect(sessionClaimsReader).toBeInstanceOf(SessionClaimsReader);
  });

  it('returns null for a null token', () => {
    expect(reader.read(null)).toBeNull();
  });

  it.each([
    { label: 'an empty string', token: '' },
    { label: 'a single segment', token: HEADER_SEGMENT },
    { label: 'two segments', token: `${HEADER_SEGMENT}.${encodeSegment(buildClaims())}` },
    { label: 'four segments', token: `${buildAccessToken(buildClaims())}.extra` },
  ])('returns null when the token has $label', ({ token }) => {
    expect(reader.read(token)).toBeNull();
  });

  it('round-trips the claims of a well-formed token', () => {
    const tenant = buildTenantRef();
    const claims = buildClaims({
      roles: [ROLES.manager],
      tenantId: tenant.id,
      tenants: [tenant],
      flags: { [FEATURE_FLAGS.tenantSwitcher]: false },
    });

    expect(reader.read(buildAccessToken(claims))).toStrictEqual({ ...claims });
  });

  it.each([
    { label: 'no padding', sub: 'ops?eu>u', remainder: 0 },
    { label: 'two padding characters', sub: 'ops?eu>ua', remainder: 2 },
    { label: 'one padding character', sub: 'ops?eu>', remainder: 3 },
  ])('decodes a base64url payload that needs $label', ({ sub, remainder }) => {
    const segment = encodeSegment({ sub });

    expect(segment).toContain('-');
    expect(segment).toContain('_');
    expect(segment.length % BASE64_BLOCK).toBe(remainder);
    expect(reader.read(tokenWithPayload(segment))).toStrictEqual({ ...NO_CLAIMS, sub });
  });

  it('returns null instead of throwing when the payload is not valid base64', () => {
    const token = tokenWithPayload('@@@@');

    expect(() => reader.read(token)).not.toThrow();
    expect(reader.read(token)).toBeNull();
  });

  it('returns null when the payload segment is empty', () => {
    expect(reader.read(tokenWithPayload(''))).toBeNull();
  });

  it('returns null when the decoded payload is not valid JSON', () => {
    const segment = Buffer.from('not json at all', 'utf8').toString('base64url');

    expect(reader.read(tokenWithPayload(segment))).toBeNull();
  });

  it.each([
    { label: 'a JSON array', payload: [buildTenantRef()] as unknown },
    { label: 'a JSON string', payload: buildUserId() },
    { label: 'a JSON number', payload: 42 },
    { label: 'JSON null', payload: null },
  ])('returns null when the payload decodes to $label', ({ payload }) => {
    expect(reader.read(tokenWithPayload(encodeSegment(payload)))).toBeNull();
  });

  it('preserves non-ASCII claim values across the utf-8 decode', () => {
    const tenant = buildTenantRef({ name: CYRILLIC_TENANT_NAME });
    const claims = buildClaims({ tenantId: tenant.id, tenants: [tenant], flags: {} });

    const read = reader.read(buildAccessToken(claims));

    expect(read).toStrictEqual({ ...claims });
    expect(read?.tenants).toStrictEqual([{ id: tenant.id, name: CYRILLIC_TENANT_NAME }]);
  });
});
