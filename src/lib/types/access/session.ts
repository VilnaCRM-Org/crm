import type { FeatureFlagState } from './feature-flag';
import type { Principal, TenantRef } from './principal';

export interface SessionClaims {
  readonly sub?: string;
  readonly email?: string;
  readonly roles?: readonly string[];
  readonly tenantId?: string;
  readonly tenants?: readonly TenantRef[];
  readonly flags?: Readonly<Record<string, boolean>>;
}

export interface SessionInput {
  readonly token: string | null;
  readonly email?: string;
}

export interface SessionSnapshot {
  readonly principal: Principal;
  readonly flags: FeatureFlagState;
}

export interface SessionLoader {
  build(input: SessionInput): SessionSnapshot | null;
}
