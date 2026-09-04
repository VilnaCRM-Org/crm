import type { TenantRef } from '@/lib/types/access/principal';

export interface TenantContextValue {
  readonly activeTenantId: string | null;
  readonly tenants: readonly TenantRef[];
  readonly switchTenant: (tenantId: string) => boolean;
}
