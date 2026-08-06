import accessState from '@/lib/access/access-state';
import { ROLES } from '@/lib/access/permission-catalog';
import TenantContextService from '@/services/access/tenant-context-service';
import { buildPrincipal, buildTenantRef } from '@tests/builders';

describe('TenantContextService', () => {
  const service = new TenantContextService();

  afterEach(() => {
    accessState.clear();
  });

  describe('active()', () => {
    it('returns null while nobody is signed in', () => {
      expect(service.active()).toBeNull();
    });

    it('returns the tenant the signed-in principal is scoped to', () => {
      const principal = buildPrincipal({ roles: [ROLES.member] });
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
      accessState.setSession(buildPrincipal({ roles: [ROLES.member], tenants }), {});

      expect(service.available()).toEqual(tenants);
      expect(service.available()).toHaveLength(2);
    });
  });

  describe('switchTo()', () => {
    it('switches and returns true for a permitted member of the target tenant', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ roles: [ROLES.manager], tenants });
      accessState.setSession(principal, {});

      expect(service.switchTo(tenants[1].id)).toBe(true);
      expect(service.active()).toBe(tenants[1].id);
      expect(accessState.get().principal?.tenantId).toBe(tenants[1].id);
      expect(service.available()).toEqual(tenants);
    });

    it('returns false and keeps the tenant when the principal cannot switch tenants', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ roles: [ROLES.member], tenants });
      accessState.setSession(principal, {});

      expect(service.switchTo(tenants[1].id)).toBe(false);
      expect(service.active()).toBe(tenants[0].id);
    });

    it('returns false and keeps the tenant for a tenant the principal does not belong to', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const outsider = buildTenantRef();
      accessState.setSession(buildPrincipal({ roles: [ROLES.manager], tenants }), {});

      expect(service.switchTo(outsider.id)).toBe(false);
      expect(service.active()).toBe(tenants[0].id);
    });

    it('returns false while nobody is signed in and leaves the state anonymous', () => {
      expect(service.switchTo(buildTenantRef().id)).toBe(false);
      expect(accessState.get().principal).toBeNull();
      expect(service.active()).toBeNull();
    });

    it('returns true when a permitted principal re-selects its current tenant', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      accessState.setSession(buildPrincipal({ roles: [ROLES.admin], tenants }), {});

      expect(service.switchTo(tenants[0].id)).toBe(true);
      expect(service.active()).toBe(tenants[0].id);
    });
  });
});
