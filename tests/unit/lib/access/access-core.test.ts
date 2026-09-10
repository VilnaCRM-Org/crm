import accessCore, { AccessCore } from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import auditCore from '@/lib/access/audit-core';
import catalogueCache from '@/lib/access/catalogue-cache';
import { FEATURE_FLAGS } from '@/lib/access/feature-flag-catalog';
import { MUTATION_KEYS } from '@/lib/access/mutation-catalogue';
import noopAuditSink from '@/lib/access/noop-audit-sink';
import correlationIdSource from '@/lib/observability/correlation-id-source';
import type { AuditEvent, AuditSink } from '@/lib/types/access/audit';
import { SAMPLE_ROLES, buildPrincipal, buildTenantRef } from '@tests/builders';

const createSink = (): jest.Mocked<AuditSink> => ({ record: jest.fn() });

describe('AccessCore', () => {
  let sink: jest.Mocked<AuditSink>;

  const recorded = (call = 0): AuditEvent => {
    const args = sink.record.mock.calls[call];
    if (args === undefined) {
      throw new Error(`no audit event recorded at call ${call}`);
    }
    return args[0];
  };

  beforeEach(() => {
    accessState.clear();
    catalogueCache.clear();
    sink = createSink();
    auditCore.useSink(sink);
  });

  afterEach(() => {
    auditCore.useSink(noopAuditSink);
    accessState.clear();
    catalogueCache.clear();
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
    it('denies every mutation while anonymous', () => {
      expect(accessCore.can(MUTATION_KEYS.createUser)).toBe(false);
    });

    // The allowed set is supplied, never derived from a role: a principal with no supplied
    // set is denied regardless of which roles the token names.
    it('denies every mutation for a hydrated principal that was supplied none', () => {
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.admin] }), {});

      expect(accessCore.can(MUTATION_KEYS.createUser)).toBe(false);
    });

    it('grants a mutation the hydrated principal was supplied', () => {
      accessState.setSession(
        buildPrincipal({
          roles: [SAMPLE_ROLES.viewer],
          allowedMutations: [MUTATION_KEYS.createUser],
        }),
        {}
      );

      expect(accessCore.can(MUTATION_KEYS.createUser)).toBe(true);
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
      const home = buildTenantRef();
      const tenants = [home, buildTenantRef()];
      accessState.setSession(buildPrincipal({ tenants }), {});

      expect(accessCore.activeTenant()).toBe(home.id);
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
    it('refuses and records a denial when the tenant is not one of the principal tenants', () => {
      const home = buildTenantRef();
      const tenants = [home, buildTenantRef()];
      const principal = buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants });
      accessState.setSession(principal, {});
      const stranger = buildTenantRef();

      expect(accessCore.switchTenant(stranger.id)).toBe(false);

      expect(accessCore.activeTenant()).toBe(home.id);
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('permission_denied');
      expect(recorded().metadata).toEqual({
        tenantId: stranger.id,
        reason: 'membership',
        correlationId: correlationIdSource.current(),
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
        reason: 'anonymous',
        correlationId: correlationIdSource.current(),
      });
    });

    it('moves the active tenant and logs a tenant_switch on the happy path', () => {
      const home = buildTenantRef();
      const target = buildTenantRef();
      const tenants = [home, target];
      const principal = buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants });
      accessState.setSession(principal, {});

      expect(accessCore.switchTenant(target.id)).toBe(true);

      expect(accessCore.activeTenant()).toBe(target.id);
      expect(accessCore.principal()).toEqual({ ...principal, tenantId: target.id });
      expect(accessCore.tenants()).toEqual(tenants);
      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('tenant_switch');
      // The audit trail names both ends of the move, so a reviewer can reconstruct it.
      expect(recorded().metadata).toEqual({
        from: home.id,
        to: target.id,
        correlationId: correlationIdSource.current(),
      });
      expect(recorded().principalId).toBe(principal.id);
      expect(recorded().tenantId).toBe(target.id);
    });

    it('accepts a switch to the already active tenant', () => {
      const home = buildTenantRef();
      const tenants = [home, buildTenantRef()];
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants }), {});

      expect(accessCore.switchTenant(home.id)).toBe(true);

      expect(accessCore.activeTenant()).toBe(home.id);
      expect(recorded().type).toBe('tenant_switch');
    });

    it('lets an admin switch as well', () => {
      const home = buildTenantRef();
      const target = buildTenantRef();
      const tenants = [home, target];
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.admin], tenants }), {});

      expect(accessCore.switchTenant(target.id)).toBe(true);

      expect(accessCore.activeTenant()).toBe(target.id);
    });

    it('clears the catalogue cache on a successful switch', () => {
      const home = buildTenantRef();
      const target = buildTenantRef();
      const tenants = [home, target];
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants }), {});
      catalogueCache.set('some-sid', { roles: [] }, 'v1');

      expect(accessCore.switchTenant(target.id)).toBe(true);

      expect(catalogueCache.get('some-sid')).toBeUndefined();
    });

    it('has already emptied the catalogue cache by the time subscribers are notified', () => {
      const home = buildTenantRef();
      const target = buildTenantRef();
      accessState.setSession(
        buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants: [home, target] }),
        {}
      );
      catalogueCache.set('some-sid', { roles: [] }, 'v1');
      const seen: unknown[] = [];
      const unsubscribe = accessState.subscribe(() => {
        seen.push(catalogueCache.get('some-sid'));
      });

      expect(accessCore.switchTenant(target.id)).toBe(true);

      unsubscribe();
      expect(seen).toStrictEqual([undefined]);
    });

    it('leaves the catalogue cache untouched when the switch is refused', () => {
      const home = buildTenantRef();
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.viewer], tenants: [home] }), {});
      const catalogue = { roles: [] };
      catalogueCache.set('some-sid', catalogue, 'v1');

      expect(accessCore.switchTenant(buildTenantRef().id)).toBe(false);

      expect(catalogueCache.get('some-sid')).toBe(catalogue);
    });
  });

  describe('recordDenial', () => {
    it('records the mutation alone when the context is empty', () => {
      accessCore.recordDenial(MUTATION_KEYS.createUser, {});

      expect(sink.record).toHaveBeenCalledTimes(1);
      expect(recorded().type).toBe('permission_denied');
      expect(recorded().metadata).toEqual({
        mutation: 'createUser',
        correlationId: correlationIdSource.current(),
      });
    });

    it('merges the supplied context with the mutation', () => {
      const tenant = buildTenantRef();

      accessCore.recordDenial(MUTATION_KEYS.createUser, { tenantId: tenant.id, route: '/deals' });

      expect(recorded().metadata).toEqual({
        tenantId: tenant.id,
        route: '/deals',
        mutation: 'createUser',
        correlationId: correlationIdSource.current(),
      });
    });

    it('always wins over a mutation key supplied in the context', () => {
      accessCore.recordDenial(MUTATION_KEYS.createUser, { mutation: 'forged' });

      expect(recorded().metadata).toEqual({
        mutation: 'createUser',
        correlationId: correlationIdSource.current(),
      });
    });

    it('stamps the current principal onto the denial', () => {
      const principal = buildPrincipal();
      accessState.setSession(principal, {});

      accessCore.recordDenial(MUTATION_KEYS.createUser, {});

      expect(recorded().principalId).toBe(principal.id);
      expect(recorded().tenantId).toBe(principal.tenantId);
    });
  });
});
