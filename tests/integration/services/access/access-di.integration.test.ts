import '../../setup';

import container from '@/config/dependency-injection-config';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS, FEATURE_FLAG_DEFAULTS } from '@/lib/access/feature-flag-catalog';
import mutationAccessDispatcher from '@/lib/access/mutation-access-dispatcher';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import sessionClaimsReader from '@/lib/access/session-claims-reader';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type { SessionClaims } from '@/lib/types/access/session';
import type AccessSessionService from '@/services/access/access-session-service';
import type AuditLogger from '@/services/access/audit-logger';
import type FeatureFlagService from '@/services/access/feature-flag-service';
import type MutationAccessService from '@/services/access/mutation-access-service';
import type SessionRepository from '@/services/access/session-repository';
import type TenantContextService from '@/services/access/tenant-context-service';
import ACCESS_TOKENS from '@/services/access/tokens';
import {
  SAMPLE_ROLES,
  buildAccessToken,
  buildClaims,
  buildEmail,
  buildTenantRef,
} from '@tests/builders';

const sessions = container.resolve<AccessSessionService>(ACCESS_TOKENS.AccessSessionService);
const mutations = container.resolve<MutationAccessService>(ACCESS_TOKENS.MutationAccessService);
const tenantContext = container.resolve<TenantContextService>(ACCESS_TOKENS.TenantContextService);
const featureFlags = container.resolve<FeatureFlagService>(ACCESS_TOKENS.AccessFeatureFlagService);
const auditLogger = container.resolve<AuditLogger>(ACCESS_TOKENS.AuditLogger);
const sessionRepository = container.resolve<SessionRepository>(ACCESS_TOKENS.SessionRepository);

const homeTenant = buildTenantRef();
const otherTenant = buildTenantRef();
const tenants = [homeTenant, otherTenant];

const managerClaims = buildClaims({
  roles: [SAMPLE_ROLES.manager],
  tenantId: homeTenant.id,
  tenants,
  flags: { [FEATURE_FLAGS.contactsModule]: true },
  allowedMutations: [MUTATION_KEYS.createUser],
});
const viewerClaims = buildClaims({
  roles: [SAMPLE_ROLES.viewer],
  tenantId: homeTenant.id,
  tenants,
});

const managerToken = buildAccessToken(managerClaims);
const viewerToken = buildAccessToken(viewerClaims);

const events: AuditEvent[] = [];
const collector: AuditSink = {
  record(event: AuditEvent): void {
    events.push(event);
  },
};

const typesOf = (): string[] => events.map((event) => event.type);
const eventAt = (index: number): AuditEvent => {
  const event = events[index];
  if (event === undefined) {
    throw new Error(`no audit event recorded at index ${index}`);
  }
  return event;
};
const lastEvent = (): AuditEvent => eventAt(events.length - 1);

describe('access services DI integration (#114)', () => {
  beforeEach(() => {
    events.length = 0;
    auditCore.useSink(collector);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessSession.end();
  });

  it('resolves every access service from the aggregated container as a singleton', () => {
    expect(container.resolve(ACCESS_TOKENS.AccessSessionService)).toBe(sessions);
    expect(container.resolve(ACCESS_TOKENS.MutationAccessService)).toBe(mutations);
    expect(container.resolve(ACCESS_TOKENS.TenantContextService)).toBe(tenantContext);
    expect(container.resolve(ACCESS_TOKENS.AccessFeatureFlagService)).toBe(featureFlags);
    expect(container.resolve(ACCESS_TOKENS.AuditLogger)).toBe(auditLogger);
    expect(container.resolve(ACCESS_TOKENS.SessionRepository)).toBe(sessionRepository);
  });

  // A hydrated session grants nothing on its own: the role name is carried for display and
  // audit, and every mutation stays denied until a resolver supplies the allowed set.
  it('hydrates a session that carries its roles but no capability', () => {
    expect(sessions.start({ token: managerToken })).toBe(true);

    const { principal } = accessState.get();
    expect(principal?.id).toBe(managerClaims.sub);
    expect(principal?.email).toBe(managerClaims.email);
    expect(principal?.roles).toEqual([SAMPLE_ROLES.manager]);
    expect(principal?.allowedMutations).toEqual([]);
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
    expect(typesOf()).toEqual(['login']);
    expect(lastEvent().principalId).toBe(managerClaims.sub);
    expect(lastEvent().tenantId).toBe(homeTenant.id);
  });

  it('grants a mutation once the dispatcher supplies it onto the live principal', async () => {
    sessions.start({ token: managerToken });

    await mutationAccessDispatcher.request({ token: managerToken });

    expect(accessState.get().principal?.allowedMutations).toEqual([MUTATION_KEYS.createUser]);
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(true);
  });

  // The catalogue is closed: a key the pinned schema does not declare is dropped rather than
  // trusted, and the drop is audited so a contract drift is visible.
  it('drops an unknown mutation key the access source granted and audits it', async () => {
    const forgedToken = buildAccessToken(
      buildClaims({
        roles: [SAMPLE_ROLES.manager],
        tenantId: homeTenant.id,
        tenants,
        allowedMutations: ['archiveUser'] as unknown as SessionClaims['allowedMutations'],
      })
    );
    sessions.start({ token: forgedToken });

    await mutationAccessDispatcher.request({ token: forgedToken });

    expect(accessState.get().principal?.allowedMutations).toEqual([]);
    expect(typesOf()).toContain('access_unknown_mutation');
  });

  it('denies every mutation while nobody is signed in', () => {
    expect(accessState.get().principal).toBeNull();

    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
  });

  it('loads the same session snapshot through the repository as through the service', () => {
    const snapshot = sessionRepository.build({ token: managerToken });

    expect(snapshot?.principal.id).toBe(managerClaims.sub);
    expect(snapshot?.flags).toEqual({ [FEATURE_FLAGS.contactsModule]: true });
    expect(sessionRepository.build({ token: null })).toBeNull();

    // Both halves of the claim: the service hydrates through that same repository, so the
    // principal it installs must match the snapshot the repository just returned.
    sessions.start({ token: managerToken });

    expect(accessState.get().principal).toEqual(snapshot?.principal);
    expect(accessState.get().flags).toEqual(snapshot?.flags);
  });

  it('switches the active tenant and audits the switch', () => {
    sessions.start({ token: managerToken });

    expect(tenantContext.active()).toBe(homeTenant.id);
    expect(tenantContext.available()).toEqual(tenants);
    expect(tenantContext.switchTo(otherTenant.id)).toBe(true);
    expect(tenantContext.active()).toBe(otherTenant.id);
    expect(typesOf()).toEqual(['login', 'tenant_switch']);
    expect(lastEvent().metadata).toEqual({
      from: homeTenant.id,
      to: otherTenant.id,
      correlationId: correlationIdSource.current(),
    });
    expect(lastEvent().tenantId).toBe(otherTenant.id);
  });

  it('denies a switch to a tenant the principal does not belong to', () => {
    const foreignTenantId = buildTenantRef().id;
    sessions.start({ token: managerToken });

    expect(tenantContext.switchTo(foreignTenantId)).toBe(false);
    expect(tenantContext.active()).toBe(homeTenant.id);
    expect(typesOf()).toEqual(['login', 'permission_denied']);
    expect(lastEvent().metadata).toEqual({
      tenantId: foreignTenantId,
      reason: 'membership',
      correlationId: correlationIdSource.current(),
    });
  });

  it('denies a switch while nobody is signed in and audits it without an origin tenant', () => {
    expect(tenantContext.active()).toBeNull();
    expect(tenantContext.switchTo(otherTenant.id)).toBe(false);
    expect(tenantContext.active()).toBeNull();
    expect(typesOf()).toEqual(['permission_denied']);
    expect(lastEvent().metadata).toEqual({
      tenantId: otherTenant.id,
      reason: 'anonymous',
      correlationId: correlationIdSource.current(),
    });
    expect(lastEvent().principalId).toBeNull();
  });

  it('reports claimed feature flags and falls back to the catalog defaults', () => {
    sessions.start({ token: managerToken });

    expect(FEATURE_FLAG_DEFAULTS[FEATURE_FLAGS.contactsModule]).toBe(false);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.dealsModule)).toBe(false);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
  });

  it('returns to an anonymous snapshot when the session ends', () => {
    sessions.start({ token: managerToken });
    sessions.end();

    expect(accessState.get().principal).toBeNull();
    expect(accessState.get().flags).toEqual({});
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
    expect(tenantContext.active()).toBeNull();
    expect(tenantContext.available()).toEqual([]);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
    expect(typesOf()).toEqual(['login', 'logout']);
  });

  it('clears the session and logs nothing when there was no principal', () => {
    expect(sessions.start({ token: null })).toBe(false);

    sessions.end();

    expect(accessState.get().principal).toBeNull();
    expect(events).toHaveLength(0);
  });
});

describe('access session hydration from token claims (#114)', () => {
  beforeEach(() => {
    events.length = 0;
    auditCore.useSink(collector);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessSession.end();
  });

  // A token that names an active tenant but no membership list still has to produce a
  // principal whose active tenant is one it belongs to.
  it('synthesises the membership list from a lone tenantId claim', () => {
    const soleTenant = buildTenantRef();
    const token = buildAccessToken({ sub: buildTenantRef().id, tenantId: soleTenant.id });

    accessSession.sync({ token });

    const { principal } = accessState.get();
    expect(principal?.tenantId).toBe(soleTenant.id);
    expect(principal?.tenants).toEqual([{ id: soleTenant.id, name: soleTenant.id }]);
  });

  it('hydrates once per token and treats a repeated sync as a no-op', () => {
    accessSession.sync({ token: managerToken });
    const hydrated = accessState.get();

    accessSession.sync({ token: managerToken });

    expect(accessState.get()).toBe(hydrated);
    expect(typesOf()).toEqual(['login']);
  });

  it('re-hydrates when the synced token changes, closing the outgoing session first', () => {
    accessSession.sync({ token: managerToken });

    accessSession.sync({ token: viewerToken });

    expect(accessState.get().principal?.id).toBe(viewerClaims.sub);
    expect(typesOf()).toEqual(['login', 'logout', 'login']);
    expect(eventAt(1).principalId).toBe(managerClaims.sub);
    expect(eventAt(1).tenantId).toBe(homeTenant.id);
    expect(eventAt(2).principalId).toBe(viewerClaims.sub);
  });

  // The store is the last line of the tenancy invariant: a loader — the DI-bound repository
  // included — that produced a principal scoped to a tenant it does not belong to must not
  // be able to publish it, and the failure has to reach the caller rather than leaving a
  // half-started session behind.
  it('refuses a loaded principal whose active tenant is not one of its memberships', () => {
    const stranger = buildTenantRef();
    const forged = {
      id: buildTenantRef().id,
      email: buildEmail(),
      roles: [SAMPLE_ROLES.manager],
      allowedMutations: [],
      tenantId: stranger.id,
      tenants: [homeTenant],
    };
    accessSession.useLoader({ build: () => ({ principal: forged, flags: {} }) });

    try {
      expect(sessions.start({ token: managerToken })).toBe(false);
      expect(accessState.get().principal).toBeNull();
      expect(events).toHaveLength(0);
    } finally {
      accessSession.useLoader(sessionRepository);
    }
  });

  it('starts an anonymous state for an empty token', () => {
    expect(accessSession.start({ token: null })).toBe(false);
    expect(accessState.get().principal).toBeNull();
    expect(events).toHaveLength(0);
  });

  // An unparseable token still hydrates a session so the shell can render, but it claims no
  // role and can invoke nothing.
  it('falls back to a role-free, capability-free session when the token is not a JWT', () => {
    const email = buildEmail();

    expect(sessions.start({ token: 'not-a-jwt', email })).toBe(true);

    const { principal } = accessState.get();
    expect(principal?.email).toBe(email);
    expect(principal?.roles).toEqual([]);
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
    expect(principal?.tenantId).toBe('default');
    expect(principal?.tenants).toEqual([{ id: 'default', name: 'default' }]);
    expect(principal?.id).toEqual(expect.any(String));
  });

  it('falls back to an empty email when neither claims nor input carry one', () => {
    sessions.start({ token: 'header.not-base64-json.signature' });

    expect(accessState.get().principal?.email).toBe('');
    expect(sessionClaimsReader.read('header.not-base64-json.signature')).toBeNull();
    expect(sessionClaimsReader.read(null)).toBeNull();
    expect(sessionClaimsReader.read('not-a-jwt')).toBeNull();
  });

  it('ignores a payload that is not a claims object', () => {
    const payloads = [null, 'a-string', ['a-list']];

    payloads.forEach((payload) => {
      sessions.start({ token: buildAccessToken(payload as unknown as Record<string, unknown>) });
      expect(accessState.get().principal?.roles).toEqual([]);
      expect(accessState.get().principal?.tenantId).toBe('default');
      expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
    });
  });

  it('ignores claim fields that carry the wrong type', () => {
    const token = buildAccessToken({
      sub: 42,
      email: 7,
      roles: SAMPLE_ROLES.admin,
      tenantId: 9,
      tenants: 'not-a-list',
      flags: 'not-an-object',
    });

    sessions.start({ token });

    const { principal, flags } = accessState.get();
    expect(principal?.email).toBe('');
    expect(principal?.roles).toEqual([]);
    expect(principal?.tenantId).toBe('default');
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
    expect(flags).toEqual({});
  });

  it('keeps only well-formed roles, tenants and feature flags', () => {
    const token = buildAccessToken({
      roles: [SAMPLE_ROLES.admin, 7],
      tenantId: homeTenant.id,
      tenants: [homeTenant, 'not-a-tenant', { id: otherTenant.id }],
      flags: {
        [FEATURE_FLAGS.dealsModule]: true,
        [FEATURE_FLAGS.tenantSwitcher]: 'yes',
        'ghost-flag': true,
      },
    });

    sessions.start({ token });

    const { principal, flags } = accessState.get();
    expect(principal?.roles).toEqual([SAMPLE_ROLES.admin]);
    expect(principal?.tenants).toEqual([homeTenant]);
    expect(flags).toEqual({ [FEATURE_FLAGS.dealsModule]: true });
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
  });
});

describe('access state and audit plumbing (#114)', () => {
  beforeEach(() => {
    events.length = 0;
    auditCore.useSink(collector);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessSession.end();
  });

  it('notifies subscribers until they unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = accessState.subscribe(listener);

    sessions.start({ token: managerToken });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    sessions.end();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(accessState.get().principal).toBeNull();
  });

  // A subscriber that throws must not strand the ones behind it, nor propagate out of the
  // write and abort the login it was reacting to.
  it('isolates a throwing subscriber from the rest of the notification', () => {
    const failure = new Error('subscriber exploded');
    const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
    const survivor = jest.fn();
    const stopThrower = accessState.subscribe(() => {
      throw failure;
    });
    const stopSurvivor = accessState.subscribe(survivor);

    expect(() => sessions.start({ token: managerToken })).not.toThrow();

    expect(survivor).toHaveBeenCalledTimes(1);
    expect(accessState.get().principal?.id).toBe(managerClaims.sub);
    expect(logged).toHaveBeenCalledWith('Access state listener threw during notification', failure);
    stopThrower();
    stopSurvivor();
    logged.mockRestore();
  });

  it('ignores an active-tenant change while nobody is signed in', () => {
    const anonymous = accessState.get();

    accessState.setActiveTenant(homeTenant.id);

    expect(accessState.get()).toBe(anonymous);
    expect(accessState.get().principal).toBeNull();
  });

  it('enriches events logged through the injected AuditLogger', () => {
    sessions.start({ token: managerToken });

    auditLogger.log({ type: 'logout', metadata: { reason: 'session-expired' } });

    expect(lastEvent().type).toBe('logout');
    expect(lastEvent().metadata).toEqual({
      reason: 'session-expired',
      correlationId: correlationIdSource.current(),
    });
    expect(lastEvent().principalId).toBe(managerClaims.sub);
    expect(lastEvent().tenantId).toBe(homeTenant.id);
  });

  it('drops events through the default no-op sink without throwing', () => {
    auditCore.useSink(noopAuditSink);

    auditLogger.log({ type: 'login' });

    expect(events).toHaveLength(0);
  });

  it('keeps the flow alive when the sink throws', () => {
    const failure = new Error('sink is down');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    auditCore.useSink({
      record(): void {
        throw failure;
      },
    });

    expect(sessions.start({ token: managerToken })).toBe(true);
    expect(accessState.get().principal?.id).toBe(managerClaims.sub);
    expect(consoleError).toHaveBeenCalledWith('Audit sink threw while recording an event', failure);

    consoleError.mockRestore();
  });
});
