import type { FeatureFlagState } from '@/lib/types/access/feature-flag';
import type { AccessSnapshot, Principal } from '@/lib/types/access/principal';

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

  public setSession(principal: Principal, flags: FeatureFlagState): void {
    this.write({ principal, flags });
  }

  public setActiveTenant(tenantId: string): void {
    const { principal, flags } = this.snapshot;
    if (principal === null) return;
    this.write({ principal: { ...principal, tenantId }, flags });
  }

  public clear(): void {
    this.write(ANONYMOUS);
  }

  private write(next: AccessSnapshot): void {
    this.snapshot = Object.freeze(next);
    [...this.listeners].forEach((listener) => listener());
  }
}

const accessState = new AccessStateStore();

export default accessState;
