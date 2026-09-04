import type { FeatureFlag } from './feature-flag';
import type { Permission } from './permission';
import type { Policy } from './policy';
import type { Principal, TenantRef } from './principal';
import type { SessionInput } from './session';

export interface PermissionChecker {
  can(permission: Permission): boolean;
  canAll(permissions: readonly Permission[]): boolean;
  canAny(permissions: readonly Permission[]): boolean;
}

export interface TenantContext {
  active(): string | null;
  available(): readonly TenantRef[];
  switchTo(tenantId: string): boolean;
}

export interface FeatureFlags {
  isEnabled(flag: FeatureFlag): boolean;
}

export interface PolicyDecision<TSubject> {
  evaluate(policy: Policy<TSubject>, subject: TSubject): boolean;
}

export interface SessionSource {
  load(input: SessionInput): Principal | null;
}
