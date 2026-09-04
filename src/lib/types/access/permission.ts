export type Permission =
  | 'app:home'
  | 'contact:read'
  | 'contact:write'
  | 'contact:manage-all'
  | 'deal:read'
  | 'deal:write'
  | 'activity:read'
  | 'activity:write'
  | 'tenant:switch'
  | 'admin:manage-users';

export type Role = 'admin' | 'manager' | 'member' | 'viewer';

export type RolePermissions = Readonly<Record<Role, readonly Permission[]>>;
