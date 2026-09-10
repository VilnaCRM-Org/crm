import { inject, injectable } from 'tsyringe';

import type { AccessCore } from '@/lib/access/access-core';
import type { TenantContext } from '@/lib/types/access/access-services';
import type { TenantRef } from '@/lib/types/access/principal';

import ACCESS_TOKENS from './tokens';

@injectable()
export default class TenantContextService implements TenantContext {
  constructor(@inject(ACCESS_TOKENS.AccessCore) private readonly core: AccessCore) {}

  public active(): string | null {
    return this.core.activeTenant();
  }

  public available(): readonly TenantRef[] {
    return this.core.tenants();
  }

  public switchTo(tenantId: string): boolean {
    return this.core.switchTenant(tenantId);
  }
}
