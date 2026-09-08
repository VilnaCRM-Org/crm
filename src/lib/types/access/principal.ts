import type { FeatureFlagState } from './feature-flag';
import type { MutationKey } from './mutation-access';
import type { Permission, Role } from './permission';

export interface TenantRef {
  readonly id: string;
  readonly name: string;
}

export interface Principal {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly Role[];
  readonly permissions: readonly Permission[];
  readonly allowedMutations: readonly MutationKey[];
  readonly tenantId: string;
  readonly tenants: readonly TenantRef[];
}

export interface AccessSnapshot {
  readonly principal: Principal | null;
  readonly flags: FeatureFlagState;
}
