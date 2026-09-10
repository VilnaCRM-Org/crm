import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import sessionFactory from '@/lib/access/session-factory';
import type { SessionLoader } from '@/lib/types/access/session';
import SessionRepository from '@/services/access/session-repository';
import {
  SAMPLE_ROLES,
  buildAccessToken,
  buildClaims,
  buildEmail,
  buildTenantRef,
} from '@tests/builders';

const FALLBACK_TENANT_ID = 'default';

describe('SessionRepository', () => {
  const repository = new SessionRepository(sessionFactory);

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
      roles: [SAMPLE_ROLES.manager],
      tenantId: home.id,
      tenants,
      flags: { [FEATURE_FLAGS.contactsModule]: true },
    });

    const snapshot = repository.build({ token: buildAccessToken(claims) });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.email).toBe(claims.email);
    expect(snapshot?.principal.roles).toEqual([SAMPLE_ROLES.manager]);
    expect(snapshot?.principal.tenantId).toBe(home.id);
    expect(snapshot?.principal.tenants).toEqual(tenants);
    expect(snapshot?.principal.allowedMutations).toEqual([]);
    expect(snapshot?.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
  });

  // Least privilege on ambiguity: a token that claims nothing gets no roles and, because the
  // allowed set is only ever supplied by a resolver, no capability either.
  it('falls back to the input email, no roles and the default tenant', () => {
    const email = buildEmail();

    const snapshot = repository.build({ token: buildAccessToken({}), email });

    expect(snapshot?.principal.email).toBe(email);
    expect(snapshot?.principal.roles).toEqual([]);
    expect(snapshot?.principal.allowedMutations).toEqual([]);
    expect(snapshot?.principal.tenantId).toBe(FALLBACK_TENANT_ID);
    expect(snapshot?.principal.tenants).toEqual([
      { id: FALLBACK_TENANT_ID, name: FALLBACK_TENANT_ID },
    ]);
    expect(snapshot?.principal.id).toEqual(expect.any(String));
    expect(snapshot?.principal.id.length).toBeGreaterThan(0);
    expect(snapshot?.flags).toEqual({});
  });

  // The privileged-sounding role name grants nothing on its own — the server decides, and it
  // has supplied nothing yet.
  it('grants an admin-named token no capability of its own', () => {
    const claims = buildClaims({ roles: [SAMPLE_ROLES.admin] });

    const snapshot = repository.build({ token: buildAccessToken(claims) });

    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.roles).toEqual([SAMPLE_ROLES.admin]);
    expect(snapshot?.principal.allowedMutations).toEqual([]);
    expect(snapshot?.flags).toEqual({});
  });

  // The repository IS the SessionLoader the AccessSession installs, so `build` is the whole
  // contract: it must satisfy the structural type the session accepts.
  it('satisfies the SessionLoader contract the access session installs', () => {
    const claims = buildClaims({ roles: [SAMPLE_ROLES.manager] });
    const input = { token: buildAccessToken(claims) };
    const loader: SessionLoader = repository;

    const snapshot = loader.build(input);

    expect(snapshot?.principal.id).toBe(claims.sub);
    expect(snapshot?.principal.roles).toEqual([SAMPLE_ROLES.manager]);
  });

  it('reads the token it is given rather than a cached one', () => {
    const first = buildClaims({ roles: [SAMPLE_ROLES.viewer] });
    const second = buildClaims({ roles: [SAMPLE_ROLES.admin] });

    expect(repository.build({ token: buildAccessToken(first) })?.principal.id).toBe(first.sub);
    expect(repository.build({ token: buildAccessToken(second) })?.principal.roles).toEqual([
      SAMPLE_ROLES.admin,
    ]);
    expect(repository.build({ token: null })).toBeNull();
  });
});
