import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { DEFAULT_ROLE, PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import sessionFactory, { SessionFactory } from '@/lib/access/session-factory';
import type { SessionInput, SessionSnapshot } from '@/lib/types/access/session';
import {
  buildAccessToken,
  buildClaims,
  buildEmail,
  buildTenantRef,
  buildUserId,
  encodeSegment,
} from '@tests/builders';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALLBACK_TENANT_ID = 'default';
const UNKNOWN_ROLE = 'sorcerer';
const UNKNOWN_FLAG = 'billing-module';

describe('SessionFactory', () => {
  const factory = new SessionFactory();

  const requireSnapshot = (input: SessionInput): SessionSnapshot => {
    const snapshot = factory.build(input);
    if (snapshot === null) throw new Error('expected the factory to build a session snapshot');
    return snapshot;
  };

  it('exports a shared singleton instance', () => {
    expect(sessionFactory).toBeInstanceOf(SessionFactory);
  });

  it('returns null for a null token', () => {
    expect(factory.build({ token: null })).toBeNull();
  });

  it('returns null for an empty token', () => {
    expect(factory.build({ token: '', email: buildEmail() })).toBeNull();
  });

  it('mirrors the claimed identity and expands the claimed roles', () => {
    const tenant = buildTenantRef();
    const other = buildTenantRef();
    const claims = buildClaims({
      roles: [ROLES.manager],
      tenantId: tenant.id,
      tenants: [tenant, other],
      flags: {},
    });

    const snapshot = requireSnapshot({ token: buildAccessToken(claims) });

    expect(snapshot).toStrictEqual({
      principal: {
        id: claims.sub,
        email: claims.email,
        roles: [ROLES.manager],
        permissions: permissionResolver.expand([ROLES.manager]),
        tenantId: tenant.id,
        tenants: [tenant, other],
      },
      flags: {},
    });
    expect(snapshot.principal.permissions).toContain(PERMISSIONS.tenantSwitch);
    expect(snapshot.principal.permissions).not.toContain(PERMISSIONS.adminManageUsers);
  });

  it('discards unknown role strings and keeps the known ones', () => {
    const claims = buildClaims({ roles: [ROLES.admin, UNKNOWN_ROLE, ROLES.viewer] });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([ROLES.admin, ROLES.viewer]);
    expect(principal.permissions).toStrictEqual(
      permissionResolver.expand([ROLES.admin, ROLES.viewer])
    );
  });

  it.each([
    { label: 'only unknown roles', roles: [UNKNOWN_ROLE] },
    { label: 'an empty role list', roles: [] },
  ])('falls back to the default role when the token claims $label', ({ roles }) => {
    const claims = buildClaims({ roles });

    const { principal } = requireSnapshot({ token: buildAccessToken(claims) });

    expect(principal.roles).toStrictEqual([DEFAULT_ROLE]);
    expect(principal.permissions).toStrictEqual(permissionResolver.expand([DEFAULT_ROLE]));
    expect(principal.permissions).not.toContain(PERMISSIONS.contactManageAll);
  });

  it('generates a fresh uuid identity when the sub claim is missing', () => {
    const token = buildAccessToken({ email: buildEmail(), roles: [ROLES.member] });

    const first = requireSnapshot({ token }).principal.id;
    const second = requireSnapshot({ token }).principal.id;

    expect(first).toMatch(UUID_PATTERN);
    expect(second).toMatch(UUID_PATTERN);
    expect(first).not.toBe(second);
  });

  it('falls back to the input email when the email claim is missing', () => {
    const email = buildEmail();
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    expect(requireSnapshot({ token, email }).principal.email).toBe(email);
  });

  it('falls back to an empty email when neither the claim nor the input carries one', () => {
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    expect(requireSnapshot({ token }).principal.email).toBe('');
  });

  it('prefers the claimed email over the input email', () => {
    const claims = buildClaims();
    const token = buildAccessToken(claims);

    expect(requireSnapshot({ token, email: buildEmail() }).principal.email).toBe(claims.email);
  });

  it('falls back to the default tenant when the tenantId claim is missing', () => {
    const token = buildAccessToken({ sub: buildUserId(), roles: [ROLES.member] });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(FALLBACK_TENANT_ID);
    expect(principal.tenants).toStrictEqual([{ id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID }]);
  });

  it('synthesises the membership list from a lone tenantId claim', () => {
    const tenant = buildTenantRef();
    const token = buildAccessToken({ sub: buildUserId(), tenantId: tenant.id });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(tenant.id);
    expect(principal.tenants).toStrictEqual([{ id: tenant.id, name: tenant.id }]);
  });

  it('activates the first claimed tenant when the token names no active tenant', () => {
    const tenants = [buildTenantRef(), buildTenantRef()];
    const token = buildAccessToken({ sub: buildUserId(), tenants });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(tenants[0].id);
    expect(principal.tenants).toStrictEqual(tenants);
  });

  // A claimed active tenant outside the membership list would scope the session to a
  // tenant the principal cannot read, so it is ignored in favour of a real membership.
  it('ignores a claimed active tenant the principal does not belong to', () => {
    const tenants = [buildTenantRef(), buildTenantRef()];
    const stranger = buildTenantRef();
    const token = buildAccessToken({ sub: buildUserId(), tenantId: stranger.id, tenants });

    const { principal } = requireSnapshot({ token });

    expect(principal.tenantId).toBe(tenants[0].id);
    expect(principal.tenants).toStrictEqual(tenants);
  });

  it('honours a claimed active tenant that is one of the claimed memberships', () => {
    const tenants = [buildTenantRef(), buildTenantRef()];
    const token = buildAccessToken({ sub: buildUserId(), tenantId: tenants[1].id, tenants });

    expect(requireSnapshot({ token }).principal.tenantId).toBe(tenants[1].id);
  });

  it('keeps only the known feature flags claimed by the token', () => {
    const token = buildAccessToken({
      sub: buildUserId(),
      flags: {
        [FEATURE_FLAGS.contactsModule]: true,
        [FEATURE_FLAGS.dealsModule]: false,
        [UNKNOWN_FLAG]: true,
      },
    });

    expect(requireSnapshot({ token }).flags).toStrictEqual({
      [FEATURE_FLAGS.contactsModule]: true,
      [FEATURE_FLAGS.dealsModule]: false,
    });
  });

  it('builds an anonymous principal when the payload carries no claim record', () => {
    const email = buildEmail();
    const token = `${encodeSegment({ alg: 'none' })}.${encodeSegment('not-a-record')}.signature`;

    expect(requireSnapshot({ token, email })).toStrictEqual({
      principal: {
        id: expect.stringMatching(UUID_PATTERN),
        email,
        roles: [DEFAULT_ROLE],
        permissions: permissionResolver.expand([DEFAULT_ROLE]),
        tenantId: FALLBACK_TENANT_ID,
        tenants: [{ id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID }],
      },
      flags: {},
    });
  });
});
