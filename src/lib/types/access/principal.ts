import type { FeatureFlagState } from './feature-flag';
import type { MutationKey } from './mutation-access';

export interface TenantRef {
  readonly id: string;
  readonly name: string;
}

// `roles` is carried verbatim from the token for display and audit only. It grants nothing:
// the server owns the mapping from a role to what it may do, and `allowedMutations` is the
// only thing this client gates on (issue #114).
export interface Principal {
  readonly id: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly allowedMutations: readonly MutationKey[];
  readonly tenantId: string;
  readonly tenants: readonly TenantRef[];
}

export interface AccessSnapshot {
  readonly principal: Principal | null;
  readonly flags: FeatureFlagState;
}
