import '../../setup';

import container from '@/config/dependency-injection-config';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import catalogueCache from '@/lib/access/catalogue-cache';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import mutationAccessDispatcher from '@/lib/access/mutation-access-dispatcher';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type AccessSessionService from '@/services/access/access-session-service';
import type FeatureFlagService from '@/services/access/feature-flag-service';
import type MutationAccessService from '@/services/access/mutation-access-service';
import type TenantContextService from '@/services/access/tenant-context-service';
import ACCESS_TOKENS from '@/services/access/tokens';
import { SAMPLE_ROLES, buildAccessToken, buildClaims, buildTenantRef } from '@tests/builders';

const sessions = container.resolve<AccessSessionService>(ACCESS_TOKENS.AccessSessionService);
const mutations = container.resolve<MutationAccessService>(ACCESS_TOKENS.MutationAccessService);
const tenantContext = container.resolve<TenantContextService>(ACCESS_TOKENS.TenantContextService);
const featureFlags = container.resolve<FeatureFlagService>(ACCESS_TOKENS.AccessFeatureFlagService);

const events: AuditEvent[] = [];
const collector: AuditSink = {
  record(event: AuditEvent): void {
    events.push(event);
  },
};

const typesOf = (): string[] => events.map((event) => event.type);

const adminTenant = buildTenantRef();
const adminClaims = buildClaims({
  roles: [SAMPLE_ROLES.admin],
  tenantId: adminTenant.id,
  tenants: [adminTenant, buildTenantRef()],
  flags: { [FEATURE_FLAGS.contactsModule]: true },
  allowedMutations: [MUTATION_KEYS.createUser],
});
const adminToken = buildAccessToken(adminClaims);

const viewerTenant = buildTenantRef();
const viewerClaims = buildClaims({
  roles: [SAMPLE_ROLES.viewer],
  tenantId: viewerTenant.id,
  tenants: [viewerTenant],
});
const viewerToken = buildAccessToken(viewerClaims);

const CATALOGUE = { mutations: [MUTATION_KEYS.createUser] };
const CATALOGUE_VERSION = '2026-09-08.1';

describe('access session lifecycle across principals (#114, story 3.4)', () => {
  beforeEach(() => {
    events.length = 0;
    auditCore.useSink(collector);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessSession.end();
    catalogueCache.clear();
  });

  it('carries no grant, tenant, flag or catalogue into the next principal', async () => {
    expect(sessions.start({ token: adminToken })).toBe(true);
    const adminSid = adminClaims.sid as string;
    catalogueCache.set(adminSid, CATALOGUE, CATALOGUE_VERSION);
    expect(catalogueCache.get(adminSid)).toBe(CATALOGUE);
    await mutationAccessDispatcher.request({ token: adminToken });
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(true);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);

    sessions.end();

    expect(catalogueCache.get(adminSid)).toBeUndefined();
    expect(catalogueCache.getCatalogueVersion(adminSid)).toBeUndefined();

    expect(sessions.start({ token: viewerToken })).toBe(true);

    expect(accessState.get().principal?.id).toBe(viewerClaims.sub);
    expect(accessState.get().principal?.roles).toEqual([SAMPLE_ROLES.viewer]);
    expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
    expect(tenantContext.active()).toBe(viewerTenant.id);
    expect(tenantContext.available()).toEqual([viewerTenant]);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
    expect(catalogueCache.get(adminSid)).toBeUndefined();
    expect(catalogueCache.get(viewerClaims.sid as string)).toBeUndefined();
    expect(typesOf()).toEqual(['login', 'logout', 'login']);
  });

  it('drops the cached catalogue when a re-sync replaces the session', () => {
    accessSession.sync({ token: adminToken });
    const adminSid = adminClaims.sid as string;
    catalogueCache.set(adminSid, CATALOGUE, CATALOGUE_VERSION);
    expect(catalogueCache.getCatalogueVersion(adminSid)).toBe(CATALOGUE_VERSION);

    accessSession.sync({ token: viewerToken });

    expect(catalogueCache.get(adminSid)).toBeUndefined();
    expect(typesOf()).toEqual(['login', 'logout', 'login']);
  });

  it('answers only for the sid it currently holds', () => {
    const held = buildTenantRef().id;
    const other = buildTenantRef().id;
    catalogueCache.set(held, CATALOGUE, CATALOGUE_VERSION);

    expect(catalogueCache.get(held)).toBe(CATALOGUE);
    expect(catalogueCache.getCatalogueVersion(held)).toBe(CATALOGUE_VERSION);
    expect(catalogueCache.get(other)).toBeUndefined();
    expect(catalogueCache.getCatalogueVersion(other)).toBeUndefined();
  });

  // Server role vocabulary is passed through untouched: the client keeps no map to translate
  // it with, and no role name grants anything on its own (issue #114).
  it.each(['ROLE_USER', 'ROLE_SERVICE'])(
    'carries the %s server role through verbatim, granting nothing and auditing nothing',
    (role) => {
      const claims = buildClaims({ roles: [role], tenantId: viewerTenant.id });

      expect(sessions.start({ token: buildAccessToken(claims) })).toBe(true);

      expect(accessState.get().principal?.roles).toEqual([role]);
      expect(mutations.can(MUTATION_KEYS.createUser)).toBe(false);
      expect(typesOf()).toEqual(['login']);
    }
  );

  it('reads the identity from a subject claim as readily as from sub', () => {
    const subject = buildTenantRef().id;
    const token = buildAccessToken({ subject, tenantId: viewerTenant.id });

    expect(sessions.start({ token })).toBe(true);

    expect(accessState.get().principal?.id).toBe(subject);
  });

  it('correlates every event of a session with one id', () => {
    sessions.start({ token: adminToken });
    tenantContext.switchTo(buildTenantRef().id);
    sessions.end();

    const id = correlationIdSource.current();
    expect(typesOf()).toEqual(['login', 'permission_denied', 'logout']);
    events.forEach((event) => {
      expect(event.metadata?.correlationId).toBe(id);
    });
    expect(id).toEqual(expect.any(String));
  });
});
