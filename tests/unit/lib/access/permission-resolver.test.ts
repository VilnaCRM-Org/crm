import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from '@/lib/access/permission-catalog';
import permissionResolver, { PermissionResolver } from '@/lib/access/permission-resolver';
import type { Role } from '@/lib/types/access/permission';
import { buildPrincipal } from '@tests/builders';

const ALL_ROLES: readonly Role[] = [ROLES.admin, ROLES.manager, ROLES.member, ROLES.viewer];

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe('PermissionResolver', () => {
  it('is exported as a singleton instance of the class', () => {
    expect(permissionResolver).toBeInstanceOf(PermissionResolver);
  });

  describe('expand', () => {
    it.each(ALL_ROLES)('returns exactly the catalogued grants of %s', (role) => {
      expect(permissionResolver.expand([role])).toEqual([...ROLE_PERMISSIONS[role]]);
    });

    it('returns an empty list when no roles are supplied', () => {
      const expanded = permissionResolver.expand([]);

      expect(expanded).toEqual([]);
      expect(expanded).toHaveLength(0);
    });

    it('dedupes overlapping roles so each permission appears once', () => {
      const expanded = permissionResolver.expand([ROLES.admin, ROLES.viewer, ROLES.admin]);

      expect(expanded).toEqual([...ROLE_PERMISSIONS.admin]);
      expect(expanded).toHaveLength(ROLE_PERMISSIONS.admin.length);
      expect(new Set(expanded).size).toBe(expanded.length);
    });

    it('unions the grants of several roles in first-seen order', () => {
      const expanded = permissionResolver.expand([ROLES.member, ROLES.manager]);

      expect(expanded).toEqual([...ROLE_PERMISSIONS.manager]);
      expect(expanded).toHaveLength(9);
    });

    it('produces the full catalogue for the admin role', () => {
      expect(sorted(permissionResolver.expand([ROLES.admin]))).toEqual(
        sorted(Object.values(PERMISSIONS))
      );
    });

    it('returns a fresh array on every call', () => {
      const first = permissionResolver.expand([ROLES.viewer]);
      const second = permissionResolver.expand([ROLES.viewer]);

      expect(first).not.toBe(second);
      expect(first).toEqual(second);
    });
  });

  describe('isRole', () => {
    it.each(ALL_ROLES)('recognises %s as a known role', (role) => {
      expect(permissionResolver.isRole(role)).toBe(true);
    });

    it.each(['owner', 'ADMIN', 'Member', 'members', '', ' admin'])(
      'rejects the unknown candidate %p',
      (candidate) => {
        expect(permissionResolver.isRole(candidate)).toBe(false);
      }
    );

    it.each(['constructor', 'toString', 'hasOwnProperty', 'valueOf', 'isPrototypeOf', '__proto__'])(
      'rejects the inherited Object.prototype key %p',
      (candidate) => {
        expect(permissionResolver.isRole(candidate)).toBe(false);
      }
    );
  });

  describe('can', () => {
    it('denies an anonymous (null) principal', () => {
      expect(permissionResolver.can(null, PERMISSIONS.appHome)).toBe(false);
    });

    it('grants a permission the principal holds', () => {
      const principal = buildPrincipal({
        permissions: [PERMISSIONS.contactRead, PERMISSIONS.dealRead],
      });

      expect(permissionResolver.can(principal, PERMISSIONS.contactRead)).toBe(true);
      expect(permissionResolver.can(principal, PERMISSIONS.dealRead)).toBe(true);
    });

    it('denies a permission the principal lacks', () => {
      const principal = buildPrincipal({
        permissions: [PERMISSIONS.contactRead, PERMISSIONS.dealRead],
      });

      expect(permissionResolver.can(principal, PERMISSIONS.contactWrite)).toBe(false);
      expect(permissionResolver.can(principal, PERMISSIONS.adminManageUsers)).toBe(false);
    });

    it('denies every permission for a principal with an empty grant list', () => {
      const principal = buildPrincipal({ permissions: [] });

      expect(permissionResolver.can(principal, PERMISSIONS.appHome)).toBe(false);
    });
  });

  describe('canAll', () => {
    const principal = buildPrincipal({
      permissions: [PERMISSIONS.contactRead, PERMISSIONS.dealRead, PERMISSIONS.appHome],
    });

    it('is vacuously true for an empty permission list', () => {
      expect(permissionResolver.canAll(principal, [])).toBe(true);
    });

    it('is vacuously true for an empty permission list even when anonymous', () => {
      expect(permissionResolver.canAll(null, [])).toBe(true);
    });

    it('is true when every requested permission is held', () => {
      expect(
        permissionResolver.canAll(principal, [PERMISSIONS.contactRead, PERMISSIONS.dealRead])
      ).toBe(true);
    });

    it('is false when one requested permission is missing', () => {
      expect(
        permissionResolver.canAll(principal, [PERMISSIONS.contactRead, PERMISSIONS.contactWrite])
      ).toBe(false);
    });

    it('is false when the first requested permission is missing', () => {
      expect(
        permissionResolver.canAll(principal, [PERMISSIONS.contactWrite, PERMISSIONS.contactRead])
      ).toBe(false);
    });

    it('is false for an anonymous principal with a non-empty list', () => {
      expect(permissionResolver.canAll(null, [PERMISSIONS.appHome])).toBe(false);
    });
  });

  describe('canAny', () => {
    const principal = buildPrincipal({
      permissions: [PERMISSIONS.contactRead, PERMISSIONS.dealRead],
    });

    it('is false for an empty permission list', () => {
      expect(permissionResolver.canAny(principal, [])).toBe(false);
    });

    it('is false for an empty permission list when anonymous', () => {
      expect(permissionResolver.canAny(null, [])).toBe(false);
    });

    it('is true when a later permission in the list is held', () => {
      expect(
        permissionResolver.canAny(principal, [PERMISSIONS.adminManageUsers, PERMISSIONS.dealRead])
      ).toBe(true);
    });

    it('is true when the first permission in the list is held', () => {
      expect(
        permissionResolver.canAny(principal, [PERMISSIONS.contactRead, PERMISSIONS.dealWrite])
      ).toBe(true);
    });

    it('is false when none of the requested permissions are held', () => {
      expect(
        permissionResolver.canAny(principal, [
          PERMISSIONS.adminManageUsers,
          PERMISSIONS.tenantSwitch,
        ])
      ).toBe(false);
    });

    it('is false for an anonymous principal with a non-empty list', () => {
      expect(permissionResolver.canAny(null, [PERMISSIONS.appHome])).toBe(false);
    });
  });
});
