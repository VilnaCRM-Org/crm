import accessCore from '@/lib/access/access-core';
import accessState from '@/lib/access/access-state';
import { PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import permissionResolver from '@/lib/access/permission-resolver';
import PermissionService from '@/services/access/permission-service';
import { buildPrincipal } from '@tests/builders';

describe('PermissionService', () => {
  const service = new PermissionService(accessCore, permissionResolver);

  afterEach(() => {
    accessState.clear();
  });

  describe('can()', () => {
    it('returns true for a permission the signed-in principal holds', () => {
      const principal = buildPrincipal({ roles: [ROLES.viewer] });
      accessState.setSession(principal, {});

      expect(service.can(PERMISSIONS.contactRead)).toBe(true);
    });

    it('returns false for a permission the signed-in principal lacks', () => {
      const principal = buildPrincipal({ roles: [ROLES.viewer] });
      accessState.setSession(principal, {});

      expect(service.can(PERMISSIONS.contactWrite)).toBe(false);
      expect(service.can(PERMISSIONS.adminManageUsers)).toBe(false);
    });

    it('returns false when nobody is signed in', () => {
      expect(accessState.get().principal).toBeNull();

      expect(service.can(PERMISSIONS.appHome)).toBe(false);
    });
  });

  describe('canAll()', () => {
    it('returns true only when every permission is held', () => {
      const principal = buildPrincipal({ roles: [ROLES.member] });
      accessState.setSession(principal, {});

      expect(service.canAll([PERMISSIONS.contactRead, PERMISSIONS.contactWrite])).toBe(true);
    });

    it('returns false when a single permission is missing', () => {
      const principal = buildPrincipal({ roles: [ROLES.member] });
      accessState.setSession(principal, {});

      expect(service.canAll([PERMISSIONS.contactRead, PERMISSIONS.dealWrite])).toBe(false);
    });

    it('returns false for an anonymous visitor asking for a real permission', () => {
      expect(service.canAll([PERMISSIONS.appHome])).toBe(false);
    });

    it('returns true vacuously for an empty list, even when anonymous', () => {
      expect(service.canAll([])).toBe(true);

      accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

      expect(service.canAll([])).toBe(true);
    });
  });

  describe('canAny()', () => {
    it('returns true when at least one permission is held', () => {
      const principal = buildPrincipal({ roles: [ROLES.viewer] });
      accessState.setSession(principal, {});

      expect(service.canAny([PERMISSIONS.contactWrite, PERMISSIONS.contactRead])).toBe(true);
    });

    it('returns false when none of the permissions are held', () => {
      const principal = buildPrincipal({ roles: [ROLES.viewer] });
      accessState.setSession(principal, {});

      expect(service.canAny([PERMISSIONS.contactWrite, PERMISSIONS.adminManageUsers])).toBe(false);
    });

    it('returns false for an anonymous visitor asking for a real permission', () => {
      expect(service.canAny([PERMISSIONS.appHome])).toBe(false);
    });

    it('returns false vacuously for an empty list, even for an admin', () => {
      accessState.setSession(buildPrincipal({ roles: [ROLES.admin] }), {});

      expect(service.canAny([])).toBe(false);
    });
  });

  it('reads the principal that is currently in state, not the one captured earlier', () => {
    accessState.setSession(buildPrincipal({ roles: [ROLES.viewer] }), {});

    expect(service.canAll([PERMISSIONS.adminManageUsers])).toBe(false);

    accessState.setSession(buildPrincipal({ roles: [ROLES.admin] }), {});

    expect(service.canAll([PERMISSIONS.adminManageUsers])).toBe(true);
    expect(service.canAny([PERMISSIONS.adminManageUsers])).toBe(true);
  });
});
