import accessCore from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import TenantContextService from '@/services/access/tenant-context-service';
import { SAMPLE_ROLES, buildPrincipal, buildTenantRef } from '@tests/builders';

describe('TenantContextService', () => {
  const service = new TenantContextService(accessCore);

  afterEach(() => {
    accessState.clear();
  });

  describe('active()', () => {
    it('returns null while nobody is signed in', () => {
      expect(service.active()).toBeNull();
    });

    it('returns the tenant the signed-in principal is scoped to', () => {
      const principal = buildPrincipal({ roles: [SAMPLE_ROLES.member] });
      accessState.setSession(principal, {});

      expect(service.active()).toBe(principal.tenantId);
    });
  });

  describe('available()', () => {
    it('returns an empty list while nobody is signed in', () => {
      expect(service.available()).toEqual([]);
      expect(service.available()).toHaveLength(0);
    });

    it('returns every tenant the signed-in principal belongs to', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.member], tenants }), {});

      expect(service.available()).toEqual(tenants);
      expect(service.available()).toHaveLength(2);
    });
  });

  describe('switchTo()', () => {
    it('switches and returns true for a permitted member of the target tenant', () => {
      const target = buildTenantRef();
      const tenants = [buildTenantRef(), target];
      const principal = buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants });
      accessState.setSession(principal, {});

      expect(service.switchTo(target.id)).toBe(true);
      expect(service.active()).toBe(target.id);
      expect(accessState.get().principal?.tenantId).toBe(target.id);
      expect(service.available()).toEqual(tenants);
    });

    it('returns false and keeps the tenant for a tenant the principal does not belong to', () => {
      const home = buildTenantRef();
      const tenants = [home, buildTenantRef()];
      const outsider = buildTenantRef();
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.manager], tenants }), {});

      expect(service.switchTo(outsider.id)).toBe(false);
      expect(service.active()).toBe(home.id);
    });

    it('returns false while nobody is signed in and leaves the state anonymous', () => {
      expect(service.switchTo(buildTenantRef().id)).toBe(false);
      expect(accessState.get().principal).toBeNull();
      expect(service.active()).toBeNull();
    });

    it('returns true when a permitted principal re-selects its current tenant', () => {
      const home = buildTenantRef();
      const tenants = [home, buildTenantRef()];
      accessState.setSession(buildPrincipal({ roles: [SAMPLE_ROLES.admin], tenants }), {});

      expect(service.switchTo(home.id)).toBe(true);
      expect(service.active()).toBe(home.id);
    });
  });
});
