import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import noopAuditSink, { NoopAuditSink } from '@/lib/access/noop-audit-sink';
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

const at = <T>(list: readonly T[], index: number): T => {
  const item = list[index];

  if (item === undefined) {
    throw new Error(`missing index ${index}`);
  }

  return item;
};

const ACCESS_BINDINGS: readonly { name: string; token: symbol; type: Bound }[] = [
  { name: 'PermissionService', token: ACCESS_TOKENS.PermissionService, type: PermissionService },
  { name: 'PolicyEvaluator', token: ACCESS_TOKENS.PolicyEvaluator, type: PolicyEvaluator },
  {
    name: 'TenantContextService',
    token: ACCESS_TOKENS.TenantContextService,
    type: TenantContextService,
  },
  {
    name: 'AccessFeatureFlagService',
    token: ACCESS_TOKENS.AccessFeatureFlagService,
    type: FeatureFlagService,
  },
  { name: 'AuditLogger', token: ACCESS_TOKENS.AuditLogger, type: AuditLogger },
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

  // Registration alone changes nothing: the service's constructor is what installs the bound
  // repository as the loader, and nothing in the application resolves that service. Composing
  // the container therefore has to do it, or the binding is dead code in production and only
  // the tests that resolve it by hand ever see the configured repository.
  it('installs the bound repository as the loader when the container is composed', () => {
    const original = container.resolve<SessionRepository>(ACCESS_TOKENS.SessionRepository);
    const scoped = container.createChildContainer();
    const install = jest.spyOn(accessSession, 'useLoader');

    try {
      accessRegistrar.register(scoped);

      expect(install).toHaveBeenCalledTimes(1);
      expect(install).toHaveBeenCalledWith(scoped.resolve(ACCESS_TOKENS.SessionRepository));
      expect(at(install.mock.calls, 0)[0]).toBeInstanceOf(SessionRepository);
      expect(at(install.mock.calls, 0)[0]).not.toBe(original);
    } finally {
      install.mockRestore();
      accessSession.useLoader(original);
    }
  });

  // Resolving the service installs the container's SessionRepository as the session loader,
  // so replacing that binding really does replace where every session comes from — the
  // container-free render path included. Spying on the resolved singleton proves the
  // hydration runs through it and not through some other loader.
  it('installs the singleton session repository as the loader every hydration path uses', () => {
    const repository = container.resolve<SessionRepository>(ACCESS_TOKENS.SessionRepository);
    const service = container.resolve<AccessSessionService>(ACCESS_TOKENS.AccessSessionService);
    const build = jest.spyOn(repository, 'build');
    const claims = buildClaims();
    const input = { token: buildAccessToken(claims) };

    expect(accessSession.load(input)?.principal.id).toBe(claims.sub);
    expect(build).toHaveBeenCalledTimes(1);
    expect(build).toHaveBeenCalledWith(input);

    expect(service.start(input)).toBe(true);
    expect(build).toHaveBeenCalledTimes(2);
    expect(accessState.get().principal?.id).toBe(claims.sub);

    expect(service.start({ token: null })).toBe(false);
    expect(build).toHaveBeenCalledTimes(3);
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
      sink = noopAuditSink;
      spy = jest.spyOn(sink, 'record');
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it('defaults the audit core to a no-op sink that records nothing observable', () => {
      expect(sink).toBeInstanceOf(NoopAuditSink);
      // Drive the CORE rather than the sink export: what matters is that logging through the
      // default installation reaches this sink and returns nothing for anyone to consume.
      expect(auditCore.log({ type: 'login' })).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(at(spy.mock.results, 0).value).toBeUndefined();
    });

    it('routes audit events to the sink installed on the container-free core', () => {
      auditCore.log({ type: 'login' });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        type: 'login',
        at: FROZEN_AT,
        principalId: null,
        tenantId: null,
      });
    });

    it('routes the injectable audit logger to the same sink', () => {
      const logger = container.resolve<AuditLogger>(ACCESS_TOKENS.AuditLogger);

      logger.log({ type: 'logout' });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toEqual({
        type: 'logout',
        at: FROZEN_AT,
        principalId: null,
        tenantId: null,
      });
    });
  });
});
