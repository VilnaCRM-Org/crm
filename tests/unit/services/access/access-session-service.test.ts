import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import sessionFactory from '@/lib/access/session-factory';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import AccessSessionService from '@/services/access/access-session-service';
import SessionRepository from '@/services/access/session-repository';
import { SAMPLE_ROLES, buildAccessToken, buildClaims, buildEmail } from '@tests/builders';

const FROZEN_AT = '2026-04-05T06:07:08.009Z';

describe('AccessSessionService', () => {
  const repository = new SessionRepository(sessionFactory);
  const service = new AccessSessionService(accessSession, repository);
  const record = jest.fn<void, [AuditEvent]>();
  const sink: AuditSink = { record };
  const eventTypes = (): string[] => record.mock.calls.map(([event]) => event.type);

  beforeAll(() => {
    jest.useFakeTimers({ now: new Date(FROZEN_AT) });
  });

  afterAll(() => {
    jest.useRealTimers();
    auditCore.useSink(noopAuditSink);
  });

  beforeEach(() => {
    auditCore.useSink(sink);
  });

  afterEach(() => {
    accessSession.end();
  });

  describe('start()', () => {
    it('applies the repository snapshot and logs a login', () => {
      const claims = buildClaims({
        roles: [SAMPLE_ROLES.admin],
        flags: { [FEATURE_FLAGS.contactsModule]: true },
      });

      expect(service.start({ token: buildAccessToken(claims) })).toBe(true);

      expect(accessState.get().principal?.id).toBe(claims.sub);
      expect(accessState.get().principal?.email).toBe(claims.email);
      expect(accessState.get().principal?.roles).toEqual([SAMPLE_ROLES.admin]);
      expect(accessState.get().principal?.tenantId).toBe(claims.tenantId);
      expect(accessState.get().flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        type: 'login',
        at: FROZEN_AT,
        principalId: claims.sub,
        tenantId: claims.tenantId,
        metadata: { correlationId: correlationIdSource.current() },
      });
    });

    it('hydrates through the injected repository rather than reaching for a loader', () => {
      const build = jest.spyOn(repository, 'build');
      const claims = buildClaims({ roles: [SAMPLE_ROLES.manager] });
      const input = { token: buildAccessToken(claims) };

      expect(service.start(input)).toBe(true);

      expect(build).toHaveBeenCalledTimes(1);
      expect(build).toHaveBeenCalledWith(input);
      expect(accessState.get().principal?.id).toBe(claims.sub);
      expect(accessState.get().principal?.roles).toEqual([SAMPLE_ROLES.manager]);
    });

    // Least privilege on ambiguity: a token that claims nothing hydrates a session that can
    // do nothing, because the allowed set is only ever supplied by a resolver.
    it('passes the supplied email through and hydrates a capability-free session', () => {
      const email = buildEmail();

      expect(service.start({ token: buildAccessToken({}), email })).toBe(true);
      expect(accessState.get().principal?.email).toBe(email);
      expect(accessState.get().principal?.roles).toEqual([]);
      expect(accessState.get().principal?.allowedMutations).toEqual([]);
    });

    it('returns false, leaves the state anonymous and logs nothing for a null token', () => {
      expect(service.start({ token: null })).toBe(false);

      expect(accessState.get().principal).toBeNull();
      expect(accessState.get().flags).toEqual({});
      expect(record).not.toHaveBeenCalled();
    });

    it('closes the outgoing principal when a null token clears an existing session', () => {
      const claims = buildClaims();
      expect(service.start({ token: buildAccessToken(claims) })).toBe(true);
      expect(accessState.get().principal).not.toBeNull();

      expect(service.start({ token: null })).toBe(false);

      expect(accessState.get().principal).toBeNull();
      expect(eventTypes()).toEqual(['login', 'logout']);
      expect(record).toHaveBeenCalledTimes(2);
      expect(record).toHaveBeenLastCalledWith({
        type: 'logout',
        at: FROZEN_AT,
        principalId: claims.sub,
        tenantId: claims.tenantId,
        metadata: { correlationId: correlationIdSource.current() },
      });
    });

    it('logs out the outgoing principal before logging in the replacement', () => {
      const first = buildClaims({ roles: [SAMPLE_ROLES.viewer] });
      const second = buildClaims({ roles: [SAMPLE_ROLES.admin] });

      service.start({ token: buildAccessToken(first) });
      service.start({ token: buildAccessToken(second) });

      expect(accessState.get().principal?.id).toBe(second.sub);
      expect(accessState.get().principal?.roles).toEqual([SAMPLE_ROLES.admin]);
      expect(eventTypes()).toEqual(['login', 'logout', 'login']);
      expect(record).toHaveBeenNthCalledWith(2, {
        type: 'logout',
        at: FROZEN_AT,
        principalId: first.sub,
        tenantId: first.tenantId,
        metadata: { correlationId: correlationIdSource.current() },
      });
      expect(record).toHaveBeenNthCalledWith(3, {
        type: 'login',
        at: FROZEN_AT,
        principalId: second.sub,
        tenantId: second.tenantId,
        metadata: { correlationId: correlationIdSource.current() },
      });
      expect(record).toHaveBeenCalledTimes(3);
    });
  });

  describe('end()', () => {
    it('logs a logout for the signed-in principal and clears the state', () => {
      const claims = buildClaims({ roles: [SAMPLE_ROLES.member] });
      service.start({ token: buildAccessToken(claims) });
      record.mockClear();

      expect(service.end()).toBeUndefined();

      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        type: 'logout',
        at: FROZEN_AT,
        principalId: claims.sub,
        tenantId: claims.tenantId,
        metadata: { correlationId: correlationIdSource.current() },
      });
      expect(accessState.get().principal).toBeNull();
      expect(accessState.get().flags).toEqual({});
    });

    it('logs nothing when nobody is signed in', () => {
      service.end();

      expect(record).not.toHaveBeenCalled();
      expect(accessState.get().principal).toBeNull();
    });

    it('is idempotent across repeated calls', () => {
      service.start({ token: buildAccessToken(buildClaims()) });
      record.mockClear();

      service.end();
      service.end();

      expect(record).toHaveBeenCalledTimes(1);
      expect(accessState.get().principal).toBeNull();
    });
  });
});
