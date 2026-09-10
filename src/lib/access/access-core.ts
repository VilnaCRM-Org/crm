import type { AuditMetadata, DenialReason } from '@/lib/types/access/audit';
import type { FeatureFlag } from '@/lib/types/access/feature-flag';
import type { MutationKey } from '@/lib/types/access/mutation-access';
import type { Principal, TenantRef } from '@/lib/types/access/principal';

import accessState from './access-state';
import auditCore from './audit-core';
import catalogueCache from './catalogue-cache';
import { FEATURE_FLAG_DEFAULTS } from './feature-flag-catalog';
import mutationAccessCore from './mutation-access-core';

export class AccessCore {
  public principal(): Principal | null {
    return accessState.get().principal;
  }

  public can(mutation: MutationKey): boolean {
    return mutationAccessCore.can(this.principal(), mutation);
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

  // Membership is the only client-side condition left: which tenants a principal belongs to
  // is data the server supplied, whereas "may this principal switch tenants" is a decision
  // the server makes when it answers for the new tenant.
  public switchTenant(tenantId: string): boolean {
    const principal = this.principal();
    if (principal === null) return this.refuse(tenantId, 'anonymous');
    if (!principal.tenants.some((tenant) => tenant.id === tenantId)) {
      return this.refuse(tenantId, 'membership');
    }
    catalogueCache.clear();
    accessState.setActiveTenant(tenantId);
    auditCore.log({ type: 'tenant_switch', metadata: { from: principal.tenantId, to: tenantId } });
    return true;
  }

  public recordDenial(mutation: MutationKey, context: AuditMetadata): void {
    auditCore.log({ type: 'permission_denied', metadata: { ...context, mutation } });
  }

  private refuse(tenantId: string, reason: DenialReason): boolean {
    auditCore.log({ type: 'permission_denied', metadata: { tenantId, reason } });
    return false;
  }
}

const accessCore = new AccessCore();

export default accessCore;
