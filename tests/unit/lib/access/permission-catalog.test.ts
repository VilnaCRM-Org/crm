import type { Permission, Role } from '@/lib/types/access/permission';
import loadIsolated from '@tests/unit/utils/isolated-module';

type PermissionCatalog = typeof import('@/lib/access/permission-catalog');

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
const MEMBER_ONLY_GRANTS: readonly Permission[] = ['contact:write', 'activity:write'];
const MANAGER_ONLY_GRANTS: readonly Permission[] = [
  'contact:manage-all',
  'deal:write',
  'tenant:switch',
];
const ADMIN_ONLY_GRANTS: readonly Permission[] = ['admin:manage-users'];

const MEMBER_GRANTS: readonly Permission[] = [...VIEWER_GRANTS, ...MEMBER_ONLY_GRANTS];
const MANAGER_GRANTS: readonly Permission[] = [...MEMBER_GRANTS, ...MANAGER_ONLY_GRANTS];
const ADMIN_GRANTS: readonly Permission[] = [...MANAGER_GRANTS, ...ADMIN_ONLY_GRANTS];

// Every permission that mutates state or widens reach. The default role must hold none of
// them; the partition below is asserted against the catalogue so a newly added permission
// has to be classified as a read or a write before this file compiles a green run.
const WRITE_GRANTS: readonly Permission[] = [
  'contact:write',
  'contact:manage-all',
  'deal:write',
  'activity:write',
  'tenant:switch',
  'admin:manage-users',
];

const sorted = (values: readonly string[]): string[] => [...values].sort();

/**
 * Every catalogue here is a frozen top-level literal evaluated at module load, so it is loaded
 * inside the test body rather than imported at the top: a mutant in such a literal is otherwise
 * credited to whichever unrelated suite imported the module first and comes back unscored.
 *
 * Permission strings and the per-role grant lists are a fixed contract, so the literals ARE the
 * test case — pinned values, not Faker.
 */
const loadCatalog = (): Promise<PermissionCatalog> =>
  loadIsolated(() => import('@/lib/access/permission-catalog'));

describe('permission catalog', () => {
  describe('PERMISSIONS', () => {
    it('maps every camelCase key to its wire permission string', async () => {
      const { PERMISSIONS } = await loadCatalog();

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

    it('catalogues every member of the Permission union exactly once', async () => {
      const { PERMISSIONS } = await loadCatalog();
      const catalogued = Object.values(PERMISSIONS);

      expect(sorted(catalogued)).toEqual(sorted(UNION_PERMISSIONS));
      expect(catalogued).toHaveLength(10);
      expect(new Set(catalogued).size).toBe(catalogued.length);
    });
  });

  describe('ROLES', () => {
    it('maps every role key to its own name', async () => {
      const { ROLES } = await loadCatalog();

      expect(ROLES).toEqual({
        admin: 'admin',
        manager: 'manager',
        member: 'member',
        viewer: 'viewer',
      });
    });

    it('catalogues every member of the Role union exactly once', async () => {
      const { ROLES } = await loadCatalog();
      const catalogued = Object.values(ROLES);

      expect(sorted(catalogued)).toEqual(sorted(UNION_ROLES));
      expect(catalogued).toHaveLength(4);
      expect(new Set(catalogued).size).toBe(catalogued.length);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('grants the viewer read-only access', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.viewer).toEqual(VIEWER_GRANTS);
      expect(ROLE_PERMISSIONS.viewer).toHaveLength(4);
    });

    it('grants the member the viewer grants plus contact and activity writes', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.member).toEqual(MEMBER_GRANTS);
      expect(ROLE_PERMISSIONS.member).toHaveLength(6);
    });

    it('grants the manager the member grants plus cross-owner, deal, tenant rights', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.manager).toEqual(MANAGER_GRANTS);
      expect(ROLE_PERMISSIONS.manager).toHaveLength(9);
    });

    it('grants the admin every catalogued permission', async () => {
      const { PERMISSIONS, ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.admin).toEqual(ADMIN_GRANTS);
      expect(sorted([...ROLE_PERMISSIONS.admin])).toEqual(sorted(Object.values(PERMISSIONS)));
      expect(ROLE_PERMISSIONS.admin).toHaveLength(10);
    });

    it('has an entry for every role and no extra keys', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(sorted(Object.keys(ROLE_PERMISSIONS))).toEqual(sorted(UNION_ROLES));
    });

    it('nests the viewer grants strictly inside the member grants', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.member).toEqual(expect.arrayContaining([...VIEWER_GRANTS]));
      expect(ROLE_PERMISSIONS.member.length).toBeGreaterThan(VIEWER_GRANTS.length);
    });

    it('nests the member grants strictly inside the manager grants', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.manager).toEqual(expect.arrayContaining([...MEMBER_GRANTS]));
      expect(ROLE_PERMISSIONS.manager.length).toBeGreaterThan(MEMBER_GRANTS.length);
    });

    it('nests the manager grants strictly inside the admin grants', async () => {
      const { ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.admin).toEqual(expect.arrayContaining([...MANAGER_GRANTS]));
      expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(MANAGER_GRANTS.length);
    });

    it('never grants admin:manage-users below the admin role', async () => {
      const { PERMISSIONS, ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.viewer).not.toContain(PERMISSIONS.adminManageUsers);
      expect(ROLE_PERMISSIONS.member).not.toContain(PERMISSIONS.adminManageUsers);
      expect(ROLE_PERMISSIONS.manager).not.toContain(PERMISSIONS.adminManageUsers);
      expect(ROLE_PERMISSIONS.admin).toContain(PERMISSIONS.adminManageUsers);
    });

    it('never grants tenant:switch below the manager role', async () => {
      const { PERMISSIONS, ROLE_PERMISSIONS } = await loadCatalog();

      expect(ROLE_PERMISSIONS.viewer).not.toContain(PERMISSIONS.tenantSwitch);
      expect(ROLE_PERMISSIONS.member).not.toContain(PERMISSIONS.tenantSwitch);
      expect(ROLE_PERMISSIONS.manager).toContain(PERMISSIONS.tenantSwitch);
    });
  });

  describe('immutability', () => {
    it('freezes both catalogues and every role grant list', async () => {
      const { PERMISSIONS, ROLES, ROLE_PERMISSIONS } = await loadCatalog();

      expect(Object.isFrozen(PERMISSIONS)).toBe(true);
      expect(Object.isFrozen(ROLES)).toBe(true);
      expect(Object.isFrozen(ROLE_PERMISSIONS)).toBe(true);
      UNION_ROLES.forEach((role) => {
        expect(Object.isFrozen(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('rejects a runtime write to a role grant list', async () => {
      const { PERMISSIONS, ROLE_PERMISSIONS } = await loadCatalog();

      expect(() => {
        (ROLE_PERMISSIONS.viewer as Permission[]).push(PERMISSIONS.adminManageUsers);
      }).toThrow(TypeError);
      expect(ROLE_PERMISSIONS.viewer).toEqual(VIEWER_GRANTS);
    });

    it('rejects a runtime write to the permission catalogue', async () => {
      const { PERMISSIONS } = await loadCatalog();

      expect(() => Object.assign(PERMISSIONS, { appHome: 'app:hijacked' })).toThrow(TypeError);
      expect(PERMISSIONS.appHome).toBe('app:home');
    });
  });

  describe('DEFAULT_ROLE', () => {
    // The default role must keep 'app:home': the e2e suite and the Lighthouse budget runs
    // sign in as a DEFAULT_ROLE principal and navigate to '/', which is guarded by 'app:home'.
    it('is viewer and grants app:home, so the default session reaches home', async () => {
      const { DEFAULT_ROLE, PERMISSIONS, ROLES, ROLE_PERMISSIONS } = await loadCatalog();

      expect(DEFAULT_ROLE).toBe('viewer');
      expect(DEFAULT_ROLE).toBe(ROLES.viewer);
      expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).toContain(PERMISSIONS.appHome);
    });

    // Least privilege on ambiguity: a token whose roles the client cannot resolve falls back
    // to DEFAULT_ROLE, so that role must never carry a write capability.
    it('grants no write permission, so an unrecognised role set cannot escalate', async () => {
      const { DEFAULT_ROLE, ROLE_PERMISSIONS } = await loadCatalog();

      WRITE_GRANTS.forEach((permission) => {
        expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).not.toContain(permission);
      });
      expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).toEqual(VIEWER_GRANTS);
      expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).toHaveLength(4);
    });

    // AccessDenied offers "go to the homepage" as its recovery route, and that route is
    // itself gated on 'app:home'. If any role lacked it, the recovery link would lead
    // straight back into a refusal — so every role must carry it, or the CTA must change.
    it('is granted by every role, so the access-denied recovery route never loops', async () => {
      const { PERMISSIONS, ROLES, ROLE_PERMISSIONS } = await loadCatalog();

      Object.values(ROLES).forEach((role) => {
        expect(ROLE_PERMISSIONS[role]).toContain(PERMISSIONS.appHome);
      });
    });

    it('partitions the catalogue into the default grants and the write grants', () => {
      expect(sorted([...VIEWER_GRANTS, ...WRITE_GRANTS])).toEqual(sorted(UNION_PERMISSIONS));
      expect(WRITE_GRANTS.some((permission) => VIEWER_GRANTS.includes(permission))).toBe(false);
    });

    it('is not the most privileged role', async () => {
      const { DEFAULT_ROLE, PERMISSIONS, ROLES, ROLE_PERMISSIONS } = await loadCatalog();

      expect(DEFAULT_ROLE).not.toBe(ROLES.admin);
      expect(DEFAULT_ROLE).not.toBe(ROLES.manager);
      expect(DEFAULT_ROLE).not.toBe(ROLES.member);
      expect(ROLE_PERMISSIONS[DEFAULT_ROLE]).not.toContain(PERMISSIONS.adminManageUsers);
    });
  });
});
