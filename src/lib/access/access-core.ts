import type { AuditMetadata } from '@/lib/types/access/audit';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';
import type { Permission } from '@/lib/types/access/permission';
import type { Principal, TenantRef } from '@/lib/types/access/principal';

import accessState from './access-state';
import auditCore from './audit-core';
import { FEATURE_FLAG_DEFAULTS } from './feature-flag-catalog';
import { PERMISSIONS } from './permission-catalog';
import permissionResolver from './permission-resolver';

export class AccessCore {
  public principal(): Principal | null {
    return accessState.get().principal;
  }

  public can(permission: Permission): boolean {
    return permissionResolver.can(this.principal(), permission);
  }

  public isEnabled(flag: FeatureFlag): boolean {
    return accessState.get().flags[flag] ?? FEATURE_FLAG_DEFAULTS[flag];
  }

  public activeTenant(): string | null {
    return this.principal()?.tenantId ?? null;
  }

  public tenants(): readonly TenantRef[] {
    return this.principal()?.tenants ?? [];
  }

  public switchTenant(tenantId: string): boolean {
    const from = this.activeTenant() ?? '';
    const reason = this.refusalReason(tenantId);
    if (reason !== null) {
      this.recordDenial(PERMISSIONS.tenantSwitch, { tenantId, reason });
      return false;
    }
    accessState.setActiveTenant(tenantId);
    auditCore.log({ type: 'tenant_switch', metadata: { from, to: tenantId } });
    return true;
  }

  public recordDenial(permission: Permission, context: AuditMetadata = {}): void {
    auditCore.log({ type: 'permission_denied', metadata: { ...context, permission } });
  }

  private refusalReason(tenantId: string): string | null {
    if (!this.can(PERMISSIONS.tenantSwitch)) return 'permission';
    return this.tenants().some((tenant) => tenant.id === tenantId) ? null : 'membership';
  }
}

const accessCore = new AccessCore();

export default accessCore;
