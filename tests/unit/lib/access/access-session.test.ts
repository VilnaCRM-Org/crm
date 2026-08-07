import accessSession, { AccessSession } from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { ROLES } from '@/lib/access/permission-catalog';
import sessionFactory from '@/lib/access/session-factory';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type { Principal } from '@/lib/types/access/principal';
import type { SessionClaims } from '@/lib/types/access/session';
import {
  buildAccessToken,
  buildClaims,
  buildPrincipal,
  buildTenantRef,
  buildToken,
} from '@tests/builders';

interface Hydration {
  readonly claims: SessionClaims;
  readonly tenantId: string;
  readonly token: string;
}

const buildHydration = (): Hydration => {
  const tenant = buildTenantRef();
  const claims = buildClaims({ roles: [ROLES.manager], tenantId: tenant.id, tenants: [tenant] });
  return { claims, tenantId: tenant.id, token: buildAccessToken(claims) };
};

describe('AccessSession', () => {
  const sink: { record: jest.Mock<void, [AuditEvent]> } & AuditSink = {
    record: jest.fn<void, [AuditEvent]>(),
  };
  const eventTypes = (): string[] => sink.record.mock.calls.map(([event]) => event.type);
  let session = new AccessSession();

  beforeEach(() => {
    session = new AccessSession();
    accessState.clear();
    auditCore.useSink(sink);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    auditCore.useSink(noopAuditSink);
    accessState.clear();
  });

  it('exports a shared singleton instance', () => {
    expect(accessSession).toBeInstanceOf(AccessSession);
  });

  it('stores the session and logs a single login event on start', () => {
    const { claims, tenantId, token } = buildHydration();

    expect(session.start({ token })).toBe(true);
    expect(accessState.get().principal?.id).toBe(claims.sub);
    expect(accessState.get().principal?.tenantId).toBe(tenantId);
    expect(accessState.get().flags).toStrictEqual({});
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith({
      type: 'login',
      at: expect.any(String),
      principalId: claims.sub,
      tenantId,
    });
  });

  it('closes the outgoing principal, clears the state and reports failure for a null token', () => {
    const { claims, tenantId, token } = buildHydration();
    session.start({ token });
    sink.record.mockClear();

    expect(session.start({ token: null })).toBe(false);
    expect(accessState.get().principal).toBeNull();
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith({
      type: 'logout',
      at: expect.any(String),
      principalId: claims.sub,
      tenantId,
    });
  });

  it('clears the state and reports failure without a logout when nobody was signed in', () => {
    expect(session.start({ token: null })).toBe(false);
    expect(accessState.get().principal).toBeNull();
    expect(sink.record).not.toHaveBeenCalled();
  });

  it('hydrates only once when sync is called twice with the same token', () => {
    const build = jest.spyOn(sessionFactory, 'build');
    const { claims, token } = buildHydration();

    session.sync({ token });
    session.sync({ token });

    expect(build).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(accessState.get().principal?.id).toBe(claims.sub);
  });

  it('re-hydrates when sync receives a different token, closing the outgoing session', () => {
    const first = buildHydration();
    const second = buildHydration();

    session.sync({ token: first.token });
    session.sync({ token: second.token });

    expect(accessState.get().principal?.id).toBe(second.claims.sub);
    expect(accessState.get().principal?.tenantId).toBe(second.tenantId);
    expect(eventTypes()).toEqual(['login', 'logout', 'login']);
    expect(sink.record.mock.calls[1][0].principalId).toBe(first.claims.sub);
    expect(sink.record.mock.calls[1][0].tenantId).toBe(first.tenantId);
    expect(sink.record.mock.calls[2][0].principalId).toBe(second.claims.sub);
    expect(sink.record).toHaveBeenCalledTimes(3);
  });

  // A loader that returns a principal the store refuses (an active tenant outside its own
  // memberships) must not leave the caller believing a session exists, and must not memoize
  // the token as hydrated — the next sync has to try again rather than trust a session that
  // never was.
  it('reports failure and stays anonymous when the store refuses the loaded principal', () => {
    const token = buildToken();
    const forged = { ...buildPrincipal(), tenantId: 'a-tenant-it-does-not-belong-to' };
    const tenant = buildTenantRef();
    const accepted = buildPrincipal({ tenants: [tenant], tenantId: tenant.id });
    // One loader, two answers: the retry below therefore proves the refused token was never
    // memoized as hydrated, rather than a loader swap having reset that bookkeeping.
    const principals = [forged, accepted];
    session.useLoader({ build: () => ({ principal: principals.shift() as Principal, flags: {} }) });
    sink.record.mockClear();

    expect(session.start({ token })).toBe(false);
    expect(accessState.get().principal).toBeNull();
    expect(eventTypes()).toEqual([]);

    session.sync({ token });

    expect(accessState.get().principal).toBe(accepted);
    expect(eventTypes()).toEqual(['login']);
  });

  it('leaves an existing session untouched when sync repeats the current empty token', () => {
    session.sync({ token: null });
    const principal = buildPrincipal();
    accessState.setSession(principal, {});

    session.sync({ token: null });

    expect(accessState.get().principal).toBe(principal);
    expect(sink.record).not.toHaveBeenCalled();
  });

  // Regression: an un-hydrated session must not mistake itself for one already bound to the
  // anonymous token, or the very first sync after a loader swap silently keeps the previous
  // principal — and its permissions — live after the token is cleared.
  it('clears a live session when the token is cleared after the loader was swapped', () => {
    const { claims, tenantId, token } = buildHydration();
    session.sync({ token });
    session.useLoader(sessionFactory);
    sink.record.mockClear();

    session.sync({ token: null });

    expect(accessState.get().principal).toBeNull();
    expect(eventTypes()).toEqual(['logout']);
    expect(sink.record).toHaveBeenCalledWith({
      type: 'logout',
      at: expect.any(String),
      principalId: claims.sub,
      tenantId,
    });
  });

  it('logs a logout event carrying the ending principal and clears the state', () => {
    const { claims, tenantId, token } = buildHydration();
    session.start({ token });
    sink.record.mockClear();

    session.end();

    expect(sink.record).toHaveBeenCalledTimes(1);
    expect(sink.record).toHaveBeenCalledWith({
      type: 'logout',
      at: expect.any(String),
      principalId: claims.sub,
      tenantId,
    });
    expect(accessState.get().principal).toBeNull();
  });

  it('logs no logout event when no principal is present', () => {
    session.end();

    expect(sink.record).not.toHaveBeenCalled();
    expect(accessState.get().principal).toBeNull();
  });

  it('forgets the ended token so a later sync with it re-hydrates', () => {
    const { claims, token } = buildHydration();
    session.start({ token });
    session.end();
    sink.record.mockClear();

    session.sync({ token });

    expect(accessState.get().principal?.id).toBe(claims.sub);
    expect(sink.record).toHaveBeenCalledTimes(1);
  });

  it('clears the state and reports failure when the loader yields no snapshot', () => {
    const { token } = buildHydration();
    session.start({ token });
    sink.record.mockClear();
    session.useLoader({ build: () => null });

    expect(session.start({ token })).toBe(false);
    expect(accessState.get().principal).toBeNull();
    // The outgoing principal is still closed out before the state is cleared.
    expect(eventTypes()).toEqual(['logout']);
    expect(sink.record).toHaveBeenCalledTimes(1);
  });

  it('routes every hydration through the installed loader', () => {
    const principal = buildPrincipal();
    const flags = { [FEATURE_FLAGS.contactsModule]: true };
    const build = jest.fn().mockReturnValue({ principal, flags });
    session.useLoader({ build });
    const input = { token: buildToken() };

    expect(session.start(input)).toBe(true);
    expect(build).toHaveBeenCalledWith(input);
    expect(accessState.get()).toStrictEqual({ principal, flags });
    expect(session.load(input)).toStrictEqual({ principal, flags });
  });

  // Regression: a failed hydration must not leave a stale token behind — otherwise sync()
  // short-circuits and the principal is never rebuilt even though the token is still valid.
  it('resets the hydrated token when a hydration fails, so sync can recover', () => {
    const { token, claims } = buildHydration();
    session.useLoader({ build: () => null });
    session.sync({ token });
    session.useLoader(sessionFactory);

    session.sync({ token });

    expect(accessState.get().principal?.id).toBe(claims.sub);
  });

  // Replacing one principal with another closes the outgoing session, so the audit trail
  // reconciles into whole sessions instead of a run of logins with no ends.
  it('logs a logout for the outgoing principal when a session is replaced', () => {
    const first = buildHydration();
    const second = buildHydration();
    session.start({ token: first.token });
    sink.record.mockClear();

    session.start({ token: second.token });

    expect(eventTypes()).toEqual(['logout', 'login']);
    expect(sink.record.mock.calls[0][0].principalId).toBe(first.claims.sub);
    expect(sink.record.mock.calls[0][0].tenantId).toBe(first.tenantId);
    expect(sink.record.mock.calls[1][0].principalId).toBe(second.claims.sub);
    expect(accessState.get().principal?.id).toBe(second.claims.sub);
    expect(sink.record).toHaveBeenCalledTimes(2);
  });
});
