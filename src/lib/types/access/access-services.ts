import type { FeatureFlag } from './feature-flag';
import type { MutationKey } from './mutation-access';
import type { Principal, TenantRef } from './principal';
import type { SessionInput } from './session';

export interface MutationChecker {
  can(mutation: MutationKey): boolean;
}

export interface TenantContext {
  active(): string | null;
  available(): readonly TenantRef[];
  switchTo(tenantId: string): boolean;
}

export interface FeatureFlags {
  isEnabled(flag: FeatureFlag): boolean;
}

export interface SessionSource {
  load(input: SessionInput): Principal | null;
}
