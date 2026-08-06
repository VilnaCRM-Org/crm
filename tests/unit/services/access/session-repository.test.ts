import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import sessionFactory from '@/lib/access/session-factory';
import SessionRepository from '@/services/access/session-repository';
import { buildAccessToken, buildClaims, buildEmail, buildTenantRef } from '@tests/builders';

const FALLBACK_TENANT_ID = 'default';

describe('SessionRepository', () => {
  const repository = new SessionRepository();

  it('returns null for a null token', () => {
    expect(repository.load({ token: null })).toBeNull();
  });

  it('returns null for an empty token', () => {
    expect(repository.load({ token: '' })).toBeNull();
  });

  it('returns null for a null token even when an email is supplied', () => {
    expect(repository.load({ token: null, email: buildEmail() })).toBeNull();
  });

  it('maps the claims of a signed token onto the session snapshot', () => {
    const tenants = [buildTenantRef(), buildTenantRef()];
    const claims = buildClaims({
      roles: [ROLES.manager],
      tenantId: tenants[0].id,
      tenants,
      flags: { [FEATURE_FLAGS.contactsModule]: true },
    });

    const snapshot = repository.load({ token: buildAccessToken(claims) });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.email).toBe(claims.email);
    expect(snapshot?.principal.roles).toEqual([ROLES.manager]);
    expect(snapshot?.principal.tenantId).toBe(tenants[0].id);
    expect(snapshot?.principal.tenants).toEqual(tenants);
    expect(snapshot?.principal.permissions).toEqual(permissionResolver.expand([ROLES.manager]));
    expect(snapshot?.principal.permissions).toContain(PERMISSIONS.tenantSwitch);
    expect(snapshot?.principal.permissions).not.toContain(PERMISSIONS.adminManageUsers);
    expect(snapshot?.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
  });

  it('falls back to the input email, the member role and the default tenant', () => {
    const email = buildEmail();

    const snapshot = repository.load({ token: buildAccessToken({}), email });

    expect(snapshot?.principal.email).toBe(email);
    expect(snapshot?.principal.roles).toEqual([ROLES.member]);
    expect(snapshot?.principal.permissions).toEqual(permissionResolver.expand([ROLES.member]));
    expect(snapshot?.principal.tenantId).toBe(FALLBACK_TENANT_ID);
    expect(snapshot?.principal.tenants).toEqual([
      { id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID },
    ]);
    expect(snapshot?.principal.id).toEqual(expect.any(String));
    expect(snapshot?.principal.id.length).toBeGreaterThan(0);
    expect(snapshot?.flags).toEqual({});
  });

  it('returns exactly what the session factory builds for the same input', () => {
    const input = { token: buildAccessToken(buildClaims({ roles: [ROLES.admin] })) };

    expect(repository.load(input)).toEqual(sessionFactory.build(input));
    expect(sessionFactory.build(input)).not.toBeNull();
  });

  it('reads the token it is given rather than a cached one', () => {
    const first = buildClaims({ roles: [ROLES.viewer] });
    const second = buildClaims({ roles: [ROLES.admin] });

    expect(repository.load({ token: buildAccessToken(first) })?.principal.id).toBe(first.sub);
    expect(repository.load({ token: buildAccessToken(second) })?.principal.roles).toEqual([
      ROLES.admin,
    ]);
    expect(repository.load({ token: null })).toBeNull();
  });
});
