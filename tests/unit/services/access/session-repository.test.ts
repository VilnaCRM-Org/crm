import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { PERMISSIONS, ROLES, ROLE_PERMISSIONS } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import type { SessionLoader } from '@/lib/types/access/session';
import SessionRepository from '@/services/access/session-repository';
import { buildAccessToken, buildClaims, buildEmail, buildTenantRef } from '@tests/builders';

const FALLBACK_TENANT_ID = 'default';

describe('SessionRepository', () => {
  const repository = new SessionRepository();

  it('returns null for a null token', () => {
    expect(repository.build({ token: null })).toBeNull();
  });

  it('returns null for an empty token', () => {
    expect(repository.build({ token: '' })).toBeNull();
  });

  it('returns null for a null token even when an email is supplied', () => {
    expect(repository.build({ token: null, email: buildEmail() })).toBeNull();
  });

  it('maps the claims of a signed token onto the session snapshot', () => {
    const home = buildTenantRef();
    const tenants = [home, buildTenantRef()];
    const claims = buildClaims({
      roles: [ROLES.manager],
      tenantId: home.id,
      tenants,
      flags: { [FEATURE_FLAGS.contactsModule]: true },
    });

    const snapshot = repository.build({ token: buildAccessToken(claims) });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.email).toBe(claims.email);
    expect(snapshot?.principal.roles).toEqual([ROLES.manager]);
    expect(snapshot?.principal.tenantId).toBe(home.id);
    expect(snapshot?.principal.tenants).toEqual(tenants);
    expect(snapshot?.principal.permissions).toEqual(permissionResolver.expand([ROLES.manager]));
    expect(snapshot?.principal.permissions).toContain(PERMISSIONS.tenantSwitch);
    expect(snapshot?.principal.permissions).not.toContain(PERMISSIONS.adminManageUsers);
    expect(snapshot?.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
  });

  // Least privilege on ambiguity: unresolvable claims fall back to the read-only viewer,
  // never to a write-capable role.
  it('falls back to the input email, the read-only viewer role and the default tenant', () => {
    const email = buildEmail();

    const snapshot = repository.build({ token: buildAccessToken({}), email });

    expect(snapshot?.principal.email).toBe(email);
    expect(snapshot?.principal.roles).toEqual([ROLES.viewer]);
    expect(snapshot?.principal.permissions).toEqual(permissionResolver.expand([ROLES.viewer]));
    expect(snapshot?.principal.permissions).toContain(PERMISSIONS.appHome);
    expect(snapshot?.principal.permissions).not.toContain(PERMISSIONS.contactWrite);
    expect(snapshot?.principal.permissions).not.toContain(PERMISSIONS.adminManageUsers);
    expect(snapshot?.principal.tenantId).toBe(FALLBACK_TENANT_ID);
    expect(snapshot?.principal.tenants).toEqual([
      { id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID },
    ]);
    expect(snapshot?.principal.id).toEqual(expect.any(String));
    expect(snapshot?.principal.id.length).toBeGreaterThan(0);
    expect(snapshot?.flags).toEqual({});
  });

  it('expands an admin token into the whole permission catalogue', () => {
    const claims = buildClaims({ roles: [ROLES.admin] });

    const snapshot = repository.build({ token: buildAccessToken(claims) });

    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.roles).toEqual([ROLES.admin]);
    expect(snapshot?.principal.permissions).toContain(PERMISSIONS.adminManageUsers);
    expect(snapshot?.principal.permissions).toEqual([...ROLE_PERMISSIONS[ROLES.admin]]);
    expect(snapshot?.principal.permissions).toHaveLength(10);
    expect(snapshot?.flags).toEqual({});
  });

  // The repository IS the SessionLoader the AccessSession installs, so `build` is the whole
  // contract: it must satisfy the structural type the session accepts.
  it('satisfies the SessionLoader contract the access session installs', () => {
    const claims = buildClaims({ roles: [ROLES.manager] });
    const input = { token: buildAccessToken(claims) };
    const loader: SessionLoader = repository;

    const snapshot = loader.build(input);

    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.roles).toEqual([ROLES.manager]);
  });

  it('reads the token it is given rather than a cached one', () => {
    const first = buildClaims({ roles: [ROLES.viewer] });
    const second = buildClaims({ roles: [ROLES.admin] });

    expect(repository.build({ token: buildAccessToken(first) })?.principal.id).toBe(first.sub);
    expect(repository.build({ token: buildAccessToken(second) })?.principal.roles).toEqual([
      ROLES.admin,
    ]);
    expect(repository.build({ token: null })).toBeNull();
  });
});
