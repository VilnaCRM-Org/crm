import type { Permission, Role, RolePermissions } from '@/lib/types/access/permission';

const PERMISSIONS = Object.freeze({
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
} as const) satisfies Readonly<Record<string, Permission>>;

const ROLES = Object.freeze({
  admin: 'admin',
  manager: 'manager',
  member: 'member',
  viewer: 'viewer',
} as const) satisfies Readonly<Record<string, Role>>;

const VIEWER_PERMISSIONS: readonly Permission[] = [
  PERMISSIONS.appHome,
  PERMISSIONS.contactRead,
  PERMISSIONS.dealRead,
  PERMISSIONS.activityRead,
];

const MEMBER_PERMISSIONS: readonly Permission[] = [
  ...VIEWER_PERMISSIONS,
  PERMISSIONS.contactWrite,
  PERMISSIONS.activityWrite,
];

const MANAGER_PERMISSIONS: readonly Permission[] = [
  ...MEMBER_PERMISSIONS,
  PERMISSIONS.contactManageAll,
  PERMISSIONS.dealWrite,
  PERMISSIONS.tenantSwitch,
];

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...MANAGER_PERMISSIONS,
  PERMISSIONS.adminManageUsers,
];

const ROLE_PERMISSIONS: RolePermissions = Object.freeze({
  admin: Object.freeze(ADMIN_PERMISSIONS),
  manager: Object.freeze(MANAGER_PERMISSIONS),
  member: Object.freeze(MEMBER_PERMISSIONS),
  viewer: Object.freeze(VIEWER_PERMISSIONS),
});

// Least privilege on ambiguity: a token whose roles the client does not recognise must not
// be upgraded to a write-capable role. `viewer` still carries `app:home`, so an opaque
// server token (or the Lighthouse/Playwright seed) still reaches the authenticated shell.
const DEFAULT_ROLE: Role = ROLES.viewer;

export { DEFAULT_ROLE, PERMISSIONS, ROLE_PERMISSIONS, ROLES };
