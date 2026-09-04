import type { FeatureFlagState } from '@/lib/types/access/feature-flag';
import type { AccessSnapshot, Principal } from '@/lib/types/access/principal';

// A snapshot is handed to every subscriber and read by every policy check, so it is sealed
// before it is published: freezing the wrapper alone would let whoever still holds the
// principal mutate roles, permissions or memberships underneath decisions already made from
// them. Sealing is in place rather than on a copy so the published principal keeps its
// identity — `useSyncExternalStore` compares snapshots by reference — and so the caller's own
// handle is sealed too, which a defensive copy would leave writable. `null` means the
// principal breaks the store's tenancy invariant — an active tenant outside its own
// membership list — and must not be published at all.
export class AccessSnapshotFactory {
  public seal(principal: Principal, flags: FeatureFlagState): AccessSnapshot | null {
    if (!this.isMember(principal)) return null;
    return Object.freeze({ principal: this.sealPrincipal(principal), flags: Object.freeze(flags) });
  }

  private isMember(principal: Principal): boolean {
    return principal.tenants.some((tenant) => tenant.id === principal.tenantId);
  }

  private sealPrincipal(principal: Principal): Principal {
    Object.freeze(principal.roles);
    Object.freeze(principal.permissions);
    principal.tenants.forEach((tenant) => Object.freeze(tenant));
    Object.freeze(principal.tenants);
    return Object.freeze(principal);
  }
}

const accessSnapshotFactory = new AccessSnapshotFactory();

export default accessSnapshotFactory;
