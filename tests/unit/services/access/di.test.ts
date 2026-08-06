import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { NoopAuditSink } from '@/lib/access/noop-audit-sink';
import type { AuditSink } from '@/lib/types/access/audit';
import AccessSessionService from '@/services/access/access-session-service';
import AuditLogger from '@/services/access/audit-logger';
import accessRegistrar from '@/services/access/di';
import FeatureFlagService from '@/services/access/feature-flag-service';
import PermissionService from '@/services/access/permission-service';
import PolicyEvaluator from '@/services/access/policy-evaluator';
import SessionRepository from '@/services/access/session-repository';
import TenantContextService from '@/services/access/tenant-context-service';
import ACCESS_TOKENS from '@/services/access/tokens';
import { buildAccessToken, buildClaims } from '@tests/builders';

type Bound = new (...args: never[]) => object;

const ACCESS_BINDINGS: readonly { name: string; token: symbol; type: Bound }[] = [
  { name: 'PermissionService', token: ACCESS_TOKENS.PermissionService, type: PermissionService },
  { name: 'PolicyEvaluator', token: ACCESS_TOKENS.PolicyEvaluator, type: PolicyEvaluator },
  {
    name: 'TenantContextService',
    token: ACCESS_TOKENS.TenantContextService,
    type: TenantContextService,
  },
  { name: 'FeatureFlagService', token: ACCESS_TOKENS.FeatureFlagService, type: FeatureFlagService },
  { name: 'AuditLogger', token: ACCESS_TOKENS.AuditLogger, type: AuditLogger },
  { name: 'AuditSink', token: ACCESS_TOKENS.AuditSink, type: NoopAuditSink },
  { name: 'SessionRepository', token: ACCESS_TOKENS.SessionRepository, type: SessionRepository },
  {
    name: 'AccessSessionService',
    token: ACCESS_TOKENS.AccessSessionService,
    type: AccessSessionService,
  },
];

const FROZEN_AT = '2026-05-06T07:08:09.010Z';

describe('access DI registrar', () => {
  afterEach(() => {
    accessSession.end();
  });

  it('is a module registrar', () => {
    expect(typeof accessRegistrar.register).toBe('function');
  });

  it('binds every declared access token', () => {
    expect(ACCESS_BINDINGS.map((binding) => binding.token)).toEqual(Object.values(ACCESS_TOKENS));
    expect(ACCESS_BINDINGS).toHaveLength(Object.keys(ACCESS_TOKENS).length);
  });

  it.each(ACCESS_BINDINGS)('resolves $name to its implementation', ({ token, type }) => {
    expect(container.isRegistered(token)).toBe(true);
    expect(container.resolve(token)).toBeInstanceOf(type);
  });

  it.each(ACCESS_BINDINGS)('registers $name as a singleton', ({ token }) => {
    const first = container.resolve(token);

    expect(container.resolve(token)).toBe(first);
    expect(container.resolve(token)).toBe(container.resolve(token));
  });

  it('injects the singleton session repository into the session service', () => {
    const service = container.resolve<AccessSessionService>(ACCESS_TOKENS.AccessSessionService);
    const claims = buildClaims();

    expect(service.start({ token: buildAccessToken(claims) })).toBe(true);
    expect(accessState.get().principal?.id).toBe(claims.sub);
    expect(service.start({ token: null })).toBe(false);
    expect(accessState.get().principal).toBeNull();
  });

  describe('audit wiring', () => {
    let sink: AuditSink;
    let spy: jest.SpyInstance;

    beforeAll(() => {
      jest.useFakeTimers({ now: new Date(FROZEN_AT) });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    beforeEach(() => {
      sink = container.resolve<AuditSink>(ACCESS_TOKENS.AuditSink);
      spy = jest.spyOn(sink, 'record');
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it('resolves the audit sink to a no-op sink', () => {
      expect(sink).toBeInstanceOf(NoopAuditSink);
      expect(() =>
        sink.record({ type: 'login', at: FROZEN_AT, principalId: null, tenantId: null })
      ).not.toThrow();
    });

    it('routes the container-free audit core to the DI-resolved sink', () => {
      auditCore.log({ type: 'login' });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'login',
        at: FROZEN_AT,
        principalId: null,
        tenantId: null,
      });
    });

    it('routes the injectable audit logger to the same sink without throwing', () => {
      const logger = container.resolve<AuditLogger>(ACCESS_TOKENS.AuditLogger);

      expect(() => logger.log({ type: 'logout' })).not.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'logout',
        at: FROZEN_AT,
        principalId: null,
        tenantId: null,
      });
    });
  });
});
