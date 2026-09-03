import { inject, injectable } from 'tsyringe';

import type { AccessCore } from '@/lib/access/access-core';
import type { PermissionResolver } from '@/lib/access/permission-resolver';
import type { PermissionChecker } from '@/lib/types/access/access-services';
import type { Permission } from '@/lib/types/access/permission';

import ACCESS_TOKENS from './tokens';

@injectable()
export default class PermissionService implements PermissionChecker {
  constructor(
    @inject(ACCESS_TOKENS.AccessCore) private readonly core: AccessCore,
    @inject(ACCESS_TOKENS.PermissionResolver) private readonly resolver: PermissionResolver
  ) {}

  public can(permission: Permission): boolean {
    return this.core.can(permission);
  }

  public canAll(permissions: readonly Permission[]): boolean {
    return this.resolver.canAll(this.core.principal(), permissions);
  }

  public canAny(permissions: readonly Permission[]): boolean {
    return this.resolver.canAny(this.core.principal(), permissions);
  }
}
