import type { AuditMetadata, DenialReason } from '@/lib/types/access/audit';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';
import type { Permission } from '@/lib/types/access/permission';
import type { Principal, TenantRef } from '@/lib/types/access/principal';

import accessState from './access-state';
import auditCore from './audit-core';
import catalogueCache from './catalogue-cache';
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

  // A successful switch clears the catalogue cache so a tenant-scoped grant from the
  // previous tenant can never leak into the new one; a refused switch leaves it untouched —
  // nothing about the session actually changed.
  public switchTenant(tenantId: string): boolean {
    const principal = this.principal();
    if (principal === null) return this.refuse(tenantId, 'permission');
    const reason = this.refusalReason(principal, tenantId);
    if (reason !== null) return this.refuse(tenantId, reason);
    accessState.setActiveTenant(tenantId);
    catalogueCache.clear();
    auditCore.log({ type: 'tenant_switch', metadata: { from: principal.tenantId, to: tenantId } });
    return true;
  }

  public recordDenial(permission: Permission, context: AuditMetadata = {}): void {
    auditCore.log({ type: 'permission_denied', metadata: { ...context, permission } });
  }

  private refuse(tenantId: string, reason: DenialReason): boolean {
    this.recordDenial(PERMISSIONS.tenantSwitch, { tenantId, reason });
    return false;
  }

  private refusalReason(principal: Principal, tenantId: string): DenialReason | null {
    if (!permissionResolver.can(principal, PERMISSIONS.tenantSwitch)) return 'permission';
    return principal.tenants.some((tenant) => tenant.id === tenantId) ? null : 'membership';
  }
}

const accessCore = new AccessCore();

export default accessCore;
