import type { FeatureFlagState } from '@/lib/types/access/feature-flag';
import type { AccessSnapshot, Principal } from '@/lib/types/access/principal';

import accessSnapshotFactory from './access-snapshot-factory';

const ANONYMOUS: AccessSnapshot = Object.freeze({ principal: null, flags: Object.freeze({}) });

export class AccessStateStore {
  private snapshot: AccessSnapshot = ANONYMOUS;

  private readonly listeners = new Set<() => void>();

  public get(): AccessSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  // The store keeps its own invariant rather than trusting the caller to: an active tenant
  // outside the membership list would make every tenant-scoped policy check — and every audit
  // event — compare against a tenant the principal cannot read. Such a principal is refused
  // rather than published, and the caller is told so.
  public setSession(principal: Principal, flags: FeatureFlagState): boolean {
    const next = accessSnapshotFactory.seal(principal, flags);
    if (next === null) return false;
    this.write(next);
    return true;
  }

  public setActiveTenant(tenantId: string): void {
    const { principal, flags } = this.snapshot;
    if (principal === null || !principal.tenants.some((tenant) => tenant.id === tenantId)) return;
    this.setSession({ ...principal, tenantId }, flags);
  }

  public clear(): void {
    this.write(ANONYMOUS);
  }

  private write(next: AccessSnapshot): void {
    this.snapshot = next;
    [...this.listeners].forEach((listener) => this.notify(listener));
  }

  // One throwing subscriber must not strand the others or abort the login/logout flow
  // that wrote the snapshot.
  private notify(listener: () => void): void {
    try {
      listener();
    } catch (error) {
      console.error('Access state listener threw during notification', error);
    }
  }
}

const accessState = new AccessStateStore();

export default accessState;
