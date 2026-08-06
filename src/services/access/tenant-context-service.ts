import { injectable } from 'tsyringe';

import accessCore from '@/lib/access/access-core';
import type { TenantContext } from '@/lib/types/access/access-services';
import type { TenantRef } from '@/lib/types/access/principal';

@injectable()
export default class TenantContextService implements TenantContext {
  public active(): string | null {
    return accessCore.activeTenant();
  }

  public available(): readonly TenantRef[] {
    return accessCore.tenants();
  }

  public switchTo(tenantId: string): boolean {
    return accessCore.switchTenant(tenantId);
  }
}
