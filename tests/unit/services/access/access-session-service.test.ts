import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import AccessSessionService from '@/services/access/access-session-service';
import SessionRepository from '@/services/access/session-repository';
import { buildAccessToken, buildClaims, buildEmail } from '@tests/builders';

const FROZEN_AT = '2026-04-05T06:07:08.009Z';

describe('AccessSessionService', () => {
  const repository = new SessionRepository();
  const service = new AccessSessionService(repository);
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
        roles: [ROLES.admin],
        flags: { [FEATURE_FLAGS.contactsModule]: true },
      });

      expect(service.start({ token: buildAccessToken(claims) })).toBe(true);

      expect(accessState.get().principal?.id).toBe(claims.sub);
      expect(accessState.get().principal?.email).toBe(claims.email);
      expect(accessState.get().principal?.roles).toEqual([ROLES.admin]);
      expect(accessState.get().principal?.tenantId).toBe(claims.tenantId);
      expect(accessState.get().flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        type: 'login',
        at: FROZEN_AT,
        principalId: claims.sub,
        tenantId: claims.tenantId,
      });
    });

    it('hydrates through the injected repository rather than reaching for a loader', () => {
      const build = jest.spyOn(repository, 'build');
      const claims = buildClaims({ roles: [ROLES.manager] });
      const input = { token: buildAccessToken(claims) };

      expect(service.start(input)).toBe(true);

      expect(build).toHaveBeenCalledTimes(1);
      expect(build).toHaveBeenCalledWith(input);
      expect(accessState.get().principal?.id).toBe(claims.sub);
      expect(accessState.get().principal?.roles).toEqual([ROLES.manager]);
    });

    // Least privilege on ambiguity: claims the client cannot resolve fall back to the
    // read-only viewer, never to a write-capable role.
    it('passes the supplied email through and defaults to the read-only viewer role', () => {
      const email = buildEmail();

      expect(service.start({ token: buildAccessToken({}), email })).toBe(true);
      expect(accessState.get().principal?.email).toBe(email);
      expect(accessState.get().principal?.roles).toEqual([ROLES.viewer]);
      expect(accessState.get().principal?.permissions).toContain(PERMISSIONS.appHome);
      expect(accessState.get().principal?.permissions).not.toContain(PERMISSIONS.contactWrite);
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
      });
    });

    it('logs out the outgoing principal before logging in the replacement', () => {
      const first = buildClaims({ roles: [ROLES.viewer] });
      const second = buildClaims({ roles: [ROLES.admin] });

      service.start({ token: buildAccessToken(first) });
      service.start({ token: buildAccessToken(second) });

      expect(accessState.get().principal?.id).toBe(second.sub);
      expect(accessState.get().principal?.roles).toEqual([ROLES.admin]);
      expect(eventTypes()).toEqual(['login', 'logout', 'login']);
      expect(record).toHaveBeenNthCalledWith(2, {
        type: 'logout',
        at: FROZEN_AT,
        principalId: first.sub,
        tenantId: first.tenantId,
      });
      expect(record).toHaveBeenNthCalledWith(3, {
        type: 'login',
        at: FROZEN_AT,
        principalId: second.sub,
        tenantId: second.tenantId,
      });
      expect(record).toHaveBeenCalledTimes(3);
    });
  });

  describe('end()', () => {
    it('logs a logout for the signed-in principal and clears the state', () => {
      const claims = buildClaims({ roles: [ROLES.member] });
      service.start({ token: buildAccessToken(claims) });
      record.mockClear();

      expect(service.end()).toBeUndefined();

      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith({
        type: 'logout',
        at: FROZEN_AT,
        principalId: claims.sub,
        tenantId: claims.tenantId,
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
