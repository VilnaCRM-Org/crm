import {
  DEFAULT_ROLE,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
} from '@/lib/access/permission-catalog';
import type { Permission, Role } from '@/lib/types/access/permission';

const EVERY_PERMISSION: Readonly<Record<Permission, true>> = {
  'app:home': true,
  'contact:read': true,
  'contact:write': true,
  'contact:manage-all': true,
  'deal:read': true,
  'deal:write': true,
  'activity:read': true,
  'activity:write': true,
  'tenant:switch': true,
  'admin:manage-users': true,
};

const EVERY_ROLE: Readonly<Record<Role, true>> = {
  admin: true,
  manager: true,
  member: true,
  viewer: true,
};

const UNION_PERMISSIONS = Object.keys(EVERY_PERMISSION) as Permission[];
const UNION_ROLES = Object.keys(EVERY_ROLE) as Role[];

const VIEWER_GRANTS: readonly Permission[] = [
  'app:home',
  'contact:read',
  'deal:read',
  'activity:read',
];
const MEMBER_GRANTS: readonly Permission[] = [...VIEWER_GRANTS, 'contact:write', 'activity:write'];
const MANAGER_GRANTS: readonly Permission[] = [
  ...MEMBER_GRANTS,
  'contact:manage-all',
  'deal:write',
  'tenant:switch',
];
const ADMIN_GRANTS: readonly Permission[] = [...MANAGER_GRANTS, 'admin:manage-users'];

const sorted = (values: readonly string[]): string[] => [...values].sort();

describe('permission catalog', () => {
  describe('PERMISSIONS', () => {
    it('maps every camelCase key to its wire permission string', () => {
      expect(PERMISSIONS).toEqual({
        appHome: 'app:home',
        contactRead: 'contact:read',
        contactWrite: 'contact:write',
        contactManageAll: 'contact:manage-all',
        dealRead: 'deal:read',
        dealWrite: 'deal:write',
        activityRead: 'activity:read',
        activityWrite: 'activity:write',
        tenantSwitch: 'tenant:switch',
        adminManageUsers: 'admin:manage-users',
      });
    });

    it('catalogues every member of the Permission union exactly once', () => {
      const catalogued = Object.values(PERMISSIONS);

      expect(sorted(catalogued)).toEqual(sorted(UNION_PERMISSIONS));
      expect(catalogued).toHaveLength(10);
      expect(new Set(catalogued).size).toBe(catalogued.length);
    });
  });

  describe('ROLES', () => {
    it('maps every role key to its own name', () => {
      expect(ROLES).toEqual({
        admin: 'admin',
        manager: 'manager',
        member: 'member',
        viewer: 'viewer',
      });
    });

    it('catalogues every member of the Role union exactly once', () => {
      const catalogued = Object.values(ROLES);

      expect(sorted(catalogued)).toEqual(sorted(UNION_ROLES));
      expect(catalogued).toHaveLength(4);
      expect(new Set(catalogued).size).toBe(catalogued.length);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('grants the viewer read-only access', () => {
      expect(ROLE_PERMISSIONS.viewer).toEqual(VIEWER_GRANTS);
      expect(ROLE_PERMISSIONS.viewer).toHaveLength(4);
    });

    it('grants the member the viewer grants plus contact and activity writes', () => {
      expect(ROLE_PERMISSIONS.member).toEqual(MEMBER_GRANTS);
      expect(ROLE_PERMISSIONS.member).toHaveLength(6);
    });

    it('grants the manager the member grants plus cross-owner, deal and tenant rights', () => {
      expect(ROLE_PERMISSIONS.manager).toEqual(MANAGER_GRANTS);
      expect(ROLE_PERMISSIONS.manager).toHaveLength(9);
    });

    it('grants the admin every catalogued permission', () => {
      expect(ROLE_PERMISSIONS.admin).toEqual(ADMIN_GRANTS);
      expect(sorted([...ROLE_PERMISSIONS.admin])).toEqual(sorted(Object.values(PERMISSIONS)));
      expect(ROLE_PERMISSIONS.admin).toHaveLength(10);
    });

    it('has an entry for every role and no extra keys', () => {
      expect(sorted(Object.keys(ROLE_PERMISSIONS))).toEqual(sorted(UNION_ROLES));
    });

    it.each([
      ['viewer', 'member'],
      ['member', 'manager'],
      ['manager', 'admin'],
    ] as const)('nests %s strictly inside %s', (narrower, wider) => {
      const narrowerGrants = ROLE_PERMISSIONS[narrower];
      const widerGrants = ROLE_PERMISSIONS[wider];

      narrowerGrants.forEach((permission) => {
        expect(widerGrants).toContain(permission);
      });
      expect(widerGrants.length).toBeGreaterThan(narrowerGrants.length);
    });

    it('never grants admin:manage-users below the admin role', () => {
      expect(ROLE_PERMISSIONS.viewer).not.toContain(PERMISSIONS.adminManageUsers);
      expect(ROLE_PERMISSIONS.member).not.toContain(PERMISSIONS.adminManageUsers);
      expect(ROLE_PERMISSIONS.manager).not.toContain(PERMISSIONS.adminManageUsers);
      expect(ROLE_PERMISSIONS.admin).toContain(PERMISSIONS.adminManageUsers);
    });

    it('never grants tenant:switch below the manager role', () => {
      expect(ROLE_PERMISSIONS.viewer).not.toContain(PERMISSIONS.tenantSwitch);
      expect(ROLE_PERMISSIONS.member).not.toContain(PERMISSIONS.tenantSwitch);
      expect(ROLE_PERMISSIONS.manager).toContain(PERMISSIONS.tenantSwitch);
    });
  });

  describe('immutability', () => {
    it('freezes both catalogues and every role grant list', () => {
      expect(Object.isFrozen(PERMISSIONS)).toBe(true);
      expect(Object.isFrozen(ROLES)).toBe(true);
      expect(Object.isFrozen(ROLE_PERMISSIONS)).toBe(true);
      UNION_ROLES.forEach((role) => {
        expect(Object.isFrozen(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('rejects a runtime write to a role grant list', () => {
      expect(() => {
        (ROLE_PERMISSIONS.viewer as Permission[]).push(PERMISSIONS.adminManageUsers);
      }).toThrow(TypeError);
      expect(ROLE_PERMISSIONS.viewer).toEqual(VIEWER_GRANTS);
    });

    it('rejects a runtime write to the permission catalogue', () => {
      expect(() => Object.assign(PERMISSIONS, { appHome: 'app:hijacked' })).toThrow(TypeError);
      expect(PERMISSIONS.appHome).toBe('app:home');
    });
  });

  describe('DEFAULT_ROLE', () => {
    // The default role must keep 'app:home': the e2e suite and the Lighthouse budget runs
    // sign in as a DEFAULT_ROLE principal and navigate to '/', which is guarded by 'app:home'.
    it('grants app:home so the default session can still reach the home route', () => {
      expect(DEFAULT_ROLE).toBe('member');
      expect(DEFAULT_ROLE).toBe(ROLES.member);
      expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).toContain(PERMISSIONS.appHome);
    });

    it('is not the most privileged role', () => {
      expect(DEFAULT_ROLE).not.toBe(ROLES.admin);
      expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).not.toContain(PERMISSIONS.adminManageUsers);
    });
  });
});
