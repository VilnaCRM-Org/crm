import { injectable } from 'tsyringe';

import accessCore from '@/lib/access/access-core';
import permissionResolver from '@/lib/access/permission-resolver';
import type { PermissionChecker } from '@/lib/types/access/access-services';
import type { Permission } from '@/lib/types/access/permission';

@injectable()
export default class PermissionService implements PermissionChecker {
  public can(permission: Permission): boolean {
    return accessCore.can(permission);
  }

  public canAll(permissions: readonly Permission[]): boolean {
    return permissionResolver.canAll(accessCore.principal(), permissions);
  }

  public canAny(permissions: readonly Permission[]): boolean {
    return permissionResolver.canAny(accessCore.principal(), permissions);
  }
}
