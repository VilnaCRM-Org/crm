import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { ROLES } from '@/lib/access/permission-catalog';
import type { AuditSink } from '@/lib/types/access/audit';
import AccessSessionService from '@/services/access/access-session-service';
import SessionRepository from '@/services/access/session-repository';
import { buildAccessToken, buildClaims, buildEmail } from '@tests/builders';

const FROZEN_AT = '2026-04-05T06:07:08.009Z';

describe('AccessSessionService', () => {
  const service = new AccessSessionService(new SessionRepository());
  const record = jest.fn();
  const sink: AuditSink = { record };

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

    it('passes the supplied email through to the hydrated principal', () => {
      const email = buildEmail();

      expect(service.start({ token: buildAccessToken({}), email })).toBe(true);
      expect(accessState.get().principal?.email).toBe(email);
      expect(accessState.get().principal?.roles).toEqual([ROLES.member]);
    });

    it('returns false, leaves the state anonymous and logs nothing for a null token', () => {
      expect(service.start({ token: null })).toBe(false);

      expect(accessState.get().principal).toBeNull();
      expect(accessState.get().flags).toEqual({});
      expect(record).not.toHaveBeenCalled();
    });

    it('clears an existing session when a null token arrives', () => {
      expect(service.start({ token: buildAccessToken(buildClaims()) })).toBe(true);
      expect(accessState.get().principal).not.toBeNull();

      expect(service.start({ token: null })).toBe(false);

      expect(accessState.get().principal).toBeNull();
      expect(record).toHaveBeenCalledTimes(1);
      expect(record).toHaveBeenCalledWith(expect.objectContaining({ type: 'login' }));
    });

    it('replaces the principal when a second token is applied', () => {
      const first = buildClaims({ roles: [ROLES.viewer] });
      const second = buildClaims({ roles: [ROLES.admin] });

      service.start({ token: buildAccessToken(first) });
      service.start({ token: buildAccessToken(second) });

      expect(accessState.get().principal?.id).toBe(second.sub);
      expect(accessState.get().principal?.roles).toEqual([ROLES.admin]);
      expect(record).toHaveBeenCalledTimes(2);
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
