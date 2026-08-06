import type { Permission, Role } from '@/lib/types/access/permission';
import type { Principal } from '@/lib/types/access/principal';

import { ROLE_PERMISSIONS } from './permission-catalog';

export class PermissionResolver {
  public expand(roles: readonly Role[]): readonly Permission[] {
    const granted = new Set<Permission>();
    roles.forEach((role) =>
      ROLE_PERMISSIONS[role].forEach((permission) => granted.add(permission))
    );
    return [...granted];
  }

  // Keyed off the grant map, not the catalog: ROLES maps keys to values, so checking its
  // keys would accept a role name that ROLE_PERMISSIONS cannot resolve (and reject one it can).
  public isRole(candidate: string): candidate is Role {
    return Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, candidate);
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
