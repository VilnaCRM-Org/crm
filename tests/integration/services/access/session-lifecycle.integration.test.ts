import '../../setup';

import container from '@/config/dependency-injection-config';
import accessSession from '@/lib/access/access-session';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import catalogueCache from '@/lib/access/catalogue-cache';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import type AccessSessionService from '@/services/access/access-session-service';
import type FeatureFlagService from '@/services/access/feature-flag-service';
import type PermissionService from '@/services/access/permission-service';
import type TenantContextService from '@/services/access/tenant-context-service';
import ACCESS_TOKENS from '@/services/access/tokens';
import { buildAccessToken, buildClaims, buildTenantRef } from '@tests/builders';

const sessions = container.resolve<AccessSessionService>(ACCESS_TOKENS.AccessSessionService);
const permissions = container.resolve<PermissionService>(ACCESS_TOKENS.PermissionService);
const tenantContext = container.resolve<TenantContextService>(ACCESS_TOKENS.TenantContextService);
const featureFlags = container.resolve<FeatureFlagService>(ACCESS_TOKENS.AccessFeatureFlagService);

const events: AuditEvent[] = [];
const collector: AuditSink = {
  record(event: AuditEvent): void {
    events.push(event);
  },
};

const typesOf = (): string[] => events.map((event) => event.type);
const eventAt = (index: number): AuditEvent => {
  const event = events[index];
  if (event === undefined) throw new Error(`no audit event recorded at index ${index}`);
  return event;
};

const adminTenant = buildTenantRef();
const adminClaims = buildClaims({
  roles: [ROLES.admin],
  tenantId: adminTenant.id,
  tenants: [adminTenant, buildTenantRef()],
  flags: { [FEATURE_FLAGS.contactsModule]: true },
});
const adminToken = buildAccessToken(adminClaims);

const viewerTenant = buildTenantRef();
const viewerClaims = buildClaims({
  roles: [ROLES.viewer],
  tenantId: viewerTenant.id,
  tenants: [viewerTenant],
});
const viewerToken = buildAccessToken(viewerClaims);

const CATALOGUE = { permissions: [PERMISSIONS.adminManageUsers] };
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

  it('carries no grant, tenant, flag or catalogue entry from one principal into the next', () => {
    expect(sessions.start({ token: adminToken })).toBe(true);
    const adminSid = adminClaims.sid as string;
    catalogueCache.set(adminSid, CATALOGUE, CATALOGUE_VERSION);
    expect(catalogueCache.get(adminSid)).toBe(CATALOGUE);
    expect(permissions.can(PERMISSIONS.adminManageUsers)).toBe(true);
    expect(featureFlags.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);

    sessions.end();

    expect(catalogueCache.get(adminSid)).toBeUndefined();
    expect(catalogueCache.getCatalogueVersion(adminSid)).toBeUndefined();

    expect(sessions.start({ token: viewerToken })).toBe(true);

    expect(accessState.get().principal?.id).toBe(viewerClaims.sub);
    expect(accessState.get().principal?.roles).toEqual([ROLES.viewer]);
    expect(permissions.can(PERMISSIONS.adminManageUsers)).toBe(false);
    expect(permissions.can(PERMISSIONS.contactWrite)).toBe(false);
    expect(permissions.canAny([PERMISSIONS.adminManageUsers, PERMISSIONS.dealWrite])).toBe(false);
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

  it('translates the interim ROLE_USER server vocabulary into the member product role', () => {
    const claims = buildClaims({ roles: ['ROLE_USER'], tenantId: viewerTenant.id });

    expect(sessions.start({ token: buildAccessToken(claims) })).toBe(true);

    expect(accessState.get().principal?.roles).toEqual([ROLES.member]);
    expect(permissions.can(PERMISSIONS.contactWrite)).toBe(true);
    expect(permissions.can(PERMISSIONS.adminManageUsers)).toBe(false);
    expect(typesOf()).toEqual(['login']);
  });

  it('drops a server role the map does not know and names it in the audit trail', () => {
    const claims = buildClaims({ roles: ['ROLE_SERVICE'], tenantId: viewerTenant.id });

    expect(sessions.start({ token: buildAccessToken(claims) })).toBe(true);

    expect(accessState.get().principal?.roles).toEqual([ROLES.viewer]);
    expect(typesOf()).toEqual(['access_role_unmapped', 'login']);
    expect(eventAt(0).metadata).toEqual({
      role: 'ROLE_SERVICE',
      correlationId: correlationIdSource.current(),
    });
  });

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
