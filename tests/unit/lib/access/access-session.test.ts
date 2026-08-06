import accessSession, { AccessSession } from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { ROLES } from '@/lib/access/permission-catalog';
import sessionFactory from '@/lib/access/session-factory';
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
  const sink = { record: jest.fn() };
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

  it('clears the state and reports failure when start receives a null token', () => {
    session.start({ token: buildHydration().token });
    sink.record.mockClear();

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

  it('re-hydrates when sync receives a different token', () => {
    const first = buildHydration();
    const second = buildHydration();

    session.sync({ token: first.token });
    session.sync({ token: second.token });

    expect(accessState.get().principal?.id).toBe(second.claims.sub);
    expect(accessState.get().principal?.tenantId).toBe(second.tenantId);
    expect(sink.record).toHaveBeenCalledTimes(2);
  });

  it('leaves an existing session untouched when sync repeats the current empty token', () => {
    const principal = buildPrincipal();
    accessState.setSession(principal, {});

    session.sync({ token: null });

    expect(accessState.get().principal).toBe(principal);
    expect(sink.record).not.toHaveBeenCalled();
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

  it('clears the state and reports failure when apply receives no snapshot', () => {
    const { token } = buildHydration();
    session.start({ token });

    expect(session.apply({ token }, null)).toBe(false);
    expect(accessState.get().principal).toBeNull();
  });

  it('writes the applied snapshot into the state and reports success', () => {
    const principal = buildPrincipal();
    const flags = { [FEATURE_FLAGS.contactsModule]: true };

    expect(session.apply({ token: buildToken() }, { principal, flags })).toBe(true);
    expect(accessState.get()).toStrictEqual({ principal, flags });
    expect(sink.record).toHaveBeenCalledTimes(1);
  });

  // Regression: apply() owns the hydrated-token bookkeeping, so a failed apply must not
  // leave a stale token behind — otherwise sync() short-circuits and the principal is
  // never re-hydrated even though the user holds a valid token.
  it('resets the hydrated token when apply clears the session, so sync can recover', () => {
    const { token, claims } = buildHydration();
    session.sync({ token });
    sink.record.mockClear();

    session.apply({ token }, null);
    session.sync({ token });

    expect(accessState.get().principal?.id).toBe(claims.sub);
  });

  // Regression: the DI path hydrates through apply(), so it must record the token too —
  // otherwise the next ProtectedRoute sync re-hydrates and emits a duplicate login event.
  it('records the token applied through the DI path so sync stays idempotent', () => {
    const { token } = buildHydration();
    const snapshot = { principal: buildPrincipal(), flags: {} };

    session.apply({ token }, snapshot);
    sink.record.mockClear();
    session.sync({ token });

    expect(sink.record).not.toHaveBeenCalled();
  });
});
