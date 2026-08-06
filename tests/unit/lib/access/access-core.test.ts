import accessCore, { AccessCore } from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import { buildPrincipal, buildTenantRef } from '@tests/builders';

const createSink = (): jest.Mocked<AuditSink> => ({ record: jest.fn() });

describe('AccessCore', () => {
  let sink: jest.Mocked<AuditSink>;

  const recorded = (call = 0): AuditEvent => sink.record.mock.calls[call][0];

  beforeEach(() => {
    accessState.clear();
    sink = createSink();
    auditCore.useSink(sink);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessState.clear();
  });

  it('is exported as a singleton instance of the class', () => {
    expect(accessCore).toBeInstanceOf(AccessCore);
  });

  describe('principal', () => {
    it('is null while anonymous', () => {
      expect(accessCore.principal()).toBeNull();
    });

    it('is the hydrated principal once a session is written', () => {
      const principal = buildPrincipal();
      accessState.setSession(principal, {});

      expect(accessCore.principal()).toBe(principal);
    });
  });

  describe('can', () => {
    it('denies every permission while anonymous', () => {
      expect(accessCore.can(PERMISSIONS.appHome)).toBe(false);
      expect(accessCore.can(PERMISSIONS.contactRead)).toBe(false);
    });

    it('grants a permission the hydrated principal holds', () => {
      accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

      expect(accessCore.can(PERMISSIONS.appHome)).toBe(true);
      expect(accessCore.can(PERMISSIONS.contactRead)).toBe(true);
    });

    it('denies a permission the hydrated principal lacks', () => {
      accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

      expect(accessCore.can(PERMISSIONS.contactWrite)).toBe(false);
      expect(accessCore.can(PERMISSIONS.adminManageUsers)).toBe(false);
    });
  });

  describe('isEnabled', () => {
    it('falls back to the shipped defaults while anonymous', () => {
      expect(accessCore.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
      expect(accessCore.isEnabled(FEATURE_FLAGS.dealsModule)).toBe(false);
      expect(accessCore.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
    });

    it('falls back to the shipped defaults when the session carries no overrides', () => {
      accessState.setSession(buildPrincipal(), {});

      expect(accessCore.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
      expect(accessCore.isEnabled(FEATURE_FLAGS.dealsModule)).toBe(false);
      expect(accessCore.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
    });

    it('uses a session override that turns a default-off flag on', () => {
      accessState.setSession(buildPrincipal(), { 'contacts-module': true });

      expect(accessCore.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);
    });

    it('uses a session override that turns a default-on flag off', () => {
      accessState.setSession(buildPrincipal(), { 'tenant-switcher': false });

      expect(accessCore.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(false);
    });

    it('applies an override to that flag only', () => {
      accessState.setSession(buildPrincipal(), { 'contacts-module': true });

      expect(accessCore.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(true);
      expect(accessCore.isEnabled(FEATURE_FLAGS.dealsModule)).toBe(false);
      expect(accessCore.isEnabled(FEATURE_FLAGS.tenantSwitcher)).toBe(true);
    });

    it('drops the overrides again once the session is cleared', () => {
      accessState.setSession(buildPrincipal(), { 'contacts-module': true });
      accessState.clear();

      expect(accessCore.isEnabled(FEATURE_FLAGS.contactsModule)).toBe(false);
    });
  });

  describe('activeTenant', () => {
    it('is null while anonymous', () => {
      expect(accessCore.activeTenant()).toBeNull();
    });

    it('is the tenant id of the hydrated principal', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      accessState.setSession(buildPrincipal({ tenants }), {});

      expect(accessCore.activeTenant()).toBe(tenants[0].id);
    });
  });

  describe('tenants', () => {
    it('is an empty list while anonymous', () => {
      expect(accessCore.tenants()).toEqual([]);
      expect(accessCore.tenants()).toHaveLength(0);
    });

    it('is the tenant list of the hydrated principal', () => {
      const tenants = [buildTenantRef(), buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ tenants });
      accessState.setSession(principal, {});

      expect(accessCore.tenants()).toBe(principal.tenants);
      expect(accessCore.tenants()).toEqual(tenants);
    });
  });

  describe('switchTenant', () => {
    it('refuses and records a denial for a principal without tenant:switch', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ roles: [ROLES.viewer], tenants });
      accessState.setSession(principal, {});

      expect(accessCore.switchTenant(tenants[1].id)).toBe(false);

      expect(accessCore.activeTenant()).toBe(tenants[0].id);
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('permission_denied');
      expect(recorded().metadata).toEqual({
        tenantId: tenants[1].id,
        reason: 'permission',
        permission: 'tenant:switch',
      });
      expect(recorded().principalId).toBe(principal.id);
    });

    it('refuses and records a denial when the tenant is not one of the principal tenants', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ roles: [ROLES.manager], tenants });
      accessState.setSession(principal, {});
      const stranger = buildTenantRef();

      expect(accessCore.can(PERMISSIONS.tenantSwitch)).toBe(true);
      expect(accessCore.switchTenant(stranger.id)).toBe(false);

      expect(accessCore.activeTenant()).toBe(tenants[0].id);
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('permission_denied');
      expect(recorded().metadata).toEqual({
        tenantId: stranger.id,
        reason: 'membership',
        permission: 'tenant:switch',
      });
    });

    it('refuses and records a denial while anonymous', () => {
      const stranger = buildTenantRef();

      expect(accessCore.switchTenant(stranger.id)).toBe(false);

      expect(accessCore.activeTenant()).toBeNull();
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('permission_denied');
      expect(recorded().principalId).toBeNull();
      expect(recorded().tenantId).toBeNull();
      expect(recorded().metadata).toEqual({
        tenantId: stranger.id,
        reason: 'permission',
        permission: 'tenant:switch',
      });
    });

    it('moves the active tenant and logs a tenant_switch on the happy path', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ roles: [ROLES.manager], tenants });
      accessState.setSession(principal, {});

      expect(accessCore.switchTenant(tenants[1].id)).toBe(true);

      expect(accessCore.activeTenant()).toBe(tenants[1].id);
      expect(accessCore.principal()).toEqual({ ...principal, tenantId: tenants[1].id });
      expect(accessCore.tenants()).toEqual(tenants);
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('tenant_switch');
      // The audit trail names both ends of the move, so a reviewer can reconstruct it.
      expect(recorded().metadata).toEqual({ from: tenants[0].id, to: tenants[1].id });
      expect(recorded().principalId).toBe(principal.id);
      expect(recorded().tenantId).toBe(tenants[1].id);
    });

    it('accepts a switch to the already active tenant', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      accessState.setSession(buildPrincipal({ roles: [ROLES.manager], tenants }), {});

      expect(accessCore.switchTenant(tenants[0].id)).toBe(true);

      expect(accessCore.activeTenant()).toBe(tenants[0].id);
      expect(recorded().type).toBe('tenant_switch');
    });

    it('lets an admin switch as well', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      accessState.setSession(buildPrincipal({ roles: [ROLES.admin], tenants }), {});

      expect(accessCore.switchTenant(tenants[1].id)).toBe(true);

      expect(accessCore.activeTenant()).toBe(tenants[1].id);
    });
  });

  describe('recordDenial', () => {
    it('records the permission alone when no context is supplied', () => {
      accessCore.recordDenial(PERMISSIONS.contactWrite);

      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('permission_denied');
      expect(recorded().metadata).toEqual({ permission: 'contact:write' });
    });

    it('merges the supplied context with the permission', () => {
      const tenant = buildTenantRef();

      accessCore.recordDenial(PERMISSIONS.dealWrite, { tenantId: tenant.id, route: '/deals' });

      expect(recorded().metadata).toEqual({
        tenantId: tenant.id,
        route: '/deals',
        permission: 'deal:write',
      });
    });

    it('always wins over a permission key supplied in the context', () => {
      accessCore.recordDenial(PERMISSIONS.adminManageUsers, {
        permission: PERMISSIONS.contactRead,
      });

      expect(recorded().metadata).toEqual({ permission: 'admin:manage-users' });
    });

    it('stamps the current principal onto the denial', () => {
      const principal = buildPrincipal();
      accessState.setSession(principal, {});

      accessCore.recordDenial(PERMISSIONS.adminManageUsers);

      expect(recorded().principalId).toBe(principal.id);
      expect(recorded().tenantId).toBe(principal.tenantId);
    });
  });
});
