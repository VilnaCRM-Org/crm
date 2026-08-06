import type { Permission, Role } from '@/lib/types/access/permission';
import type { Principal } from '@/lib/types/access/principal';

import { ROLE_PERMISSIONS, ROLES } from './permission-catalog';

export class PermissionResolver {
  public expand(roles: readonly Role[]): readonly Permission[] {
    const granted = new Set<Permission>();
    roles.forEach((role) =>
      ROLE_PERMISSIONS[role].forEach((permission) => granted.add(permission))
    );
    return [...granted];
  }

  public isRole(candidate: string): candidate is Role {
    return Object.prototype.hasOwnProperty.call(ROLES, candidate);
  }

  public can(principal: Principal | null, permission: Permission): boolean {
    return principal !== null && principal.permissions.includes(permission);
  }

  public canAll(principal: Principal | null, permissions: readonly Permission[]): boolean {
    return permissions.every((permission) => this.can(principal, permission));
  }

  public canAny(principal: Principal | null, permissions: readonly Permission[]): boolean {
    return permissions.some((permission) => this.can(principal, permission));
  }
}

const permissionResolver = new PermissionResolver();

export default permissionResolver;
