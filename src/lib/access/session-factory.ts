import { v4 as uuidv4 } from 'uuid';

import type { FeatureFlag, FeatureFlagState } from '@/lib/types/access/feature-flag';
import type { Role } from '@/lib/types/access/permission';
import type { Principal, TenantRef } from '@/lib/types/access/principal';
import type { SessionClaims, SessionInput, SessionSnapshot } from '@/lib/types/access/session';

import { FEATURE_FLAG_DEFAULTS } from './feature-flag-catalog';
import { DEFAULT_ROLE } from './permission-catalog';
import permissionResolver from './permission-resolver';
import sessionClaimsReader from './session-claims-reader';

const FALLBACK_TENANT_ID = 'default';

export class SessionFactory {
  public build(input: SessionInput): SessionSnapshot | null {
    if (!input.token) return null;
    const claims = sessionClaimsReader.read(input.token);
    return { principal: this.toPrincipal(claims, input), flags: this.toFlags(claims) };
  }

  private toPrincipal(claims: SessionClaims | null, input: SessionInput): Principal {
    const roles = this.toRoles(claims?.roles);
    const tenants = this.toTenants(claims);
    return {
      id: claims?.sub ?? uuidv4(),
      email: claims?.email ?? input.email ?? '',
      roles,
      permissions: permissionResolver.expand(roles),
      tenantId: this.toActiveTenant(claims, tenants),
      tenants,
    };
  }

  private toTenants(claims: SessionClaims | null): readonly TenantRef[] {
    const claimed = claims?.tenants ?? [];
    if (claimed.length > 0) return claimed;
    const tenantId = claims?.tenantId ?? FALLBACK_TENANT_ID;
    return [{ id: tenantId, name: tenantId }];
  }

  // The active tenant must be one the principal actually belongs to: a claimed tenantId
  // outside the membership list would scope the session to a tenant it cannot read.
  private toActiveTenant(claims: SessionClaims | null, tenants: readonly TenantRef[]): string {
    const claimed = claims?.tenantId;
    return tenants.some((tenant) => tenant.id === claimed) ? (claimed as string) : tenants[0].id;
  }

  private toRoles(claimed: readonly string[] | undefined): readonly Role[] {
    const known = (claimed ?? []).filter((role): role is Role => permissionResolver.isRole(role));
    return known.length === 0 ? [DEFAULT_ROLE] : known;
  }

  private toFlags(claims: SessionClaims | null): FeatureFlagState {
    const claimed = Object.entries(claims?.flags ?? {});
    return Object.fromEntries(claimed.filter(([flag]) => this.isFeatureFlag(flag)));
  }

  private isFeatureFlag(candidate: string): candidate is FeatureFlag {
    return Object.prototype.hasOwnProperty.call(FEATURE_FLAG_DEFAULTS, candidate);
  }
}

const sessionFactory = new SessionFactory();

export default sessionFactory;
