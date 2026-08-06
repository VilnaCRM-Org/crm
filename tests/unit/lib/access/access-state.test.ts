import accessState, { AccessStateStore } from '@/lib/access/access-state';
import type { FeatureFlagState } from '@/lib/types/access/feature-flag';
import type { AccessSnapshot } from '@/lib/types/access/principal';
import { buildPrincipal, buildTenantRef } from '@tests/builders';

const ANONYMOUS_SNAPSHOT: AccessSnapshot = { principal: null, flags: {} };

describe('AccessStateStore', () => {
  let store: AccessStateStore;

  beforeEach(() => {
    store = new AccessStateStore();
  });

  describe('get', () => {
    it('starts on the anonymous snapshot', () => {
      const snapshot = store.get();

      expect(snapshot).toEqual(ANONYMOUS_SNAPSHOT);
      expect(snapshot.principal).toBeNull();
      expect(snapshot.flags).toEqual({});
      expect(Object.isFrozen(snapshot)).toBe(true);
    });

    it('returns the same snapshot object until the next write', () => {
      expect(store.get()).toBe(store.get());
    });
  });

  describe('subscribe', () => {
    it('notifies the listener on every write', () => {
      const listener = jest.fn();
      const tenants = [buildTenantRef(), buildTenantRef()];
      store.subscribe(listener);

      store.setSession(buildPrincipal({ tenants }), {});
      expect(listener).toHaveBeenCalledTimes(1);

      store.setActiveTenant(tenants[1].id);
      expect(listener).toHaveBeenCalledTimes(2);

      store.clear();
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('does not notify a listener registered after the write', () => {
      store.setSession(buildPrincipal(), {});
      const listener = jest.fn();
      store.subscribe(listener);

      expect(listener).not.toHaveBeenCalled();
    });

    it('stops notifying once the returned unsubscribe is called', () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      store.setSession(buildPrincipal(), {});
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.clear();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    // A subscriber that throws must not strand the subscribers behind it, and must not
    // propagate out of the write and abort the login/logout flow that caused it.
    it('isolates a throwing listener from the others and from the write', () => {
      const failure = new Error('listener exploded');
      const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
      const survivor = jest.fn();
      store.subscribe(() => {
        throw failure;
      });
      store.subscribe(survivor);

      const principal = buildPrincipal();
      expect(() => store.setSession(principal, {})).not.toThrow();

      expect(survivor).toHaveBeenCalledTimes(1);
      expect(store.get().principal).toBe(principal);
      expect(logged).toHaveBeenCalledWith(
        'Access state listener threw during notification',
        failure
      );
      logged.mockRestore();
    });

    it('tolerates unsubscribing twice', () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();

      store.clear();
      expect(listener).not.toHaveBeenCalled();
    });

    it('notifies every subscriber and unsubscribes them independently', () => {
      const first = jest.fn();
      const second = jest.fn();
      const unsubscribeFirst = store.subscribe(first);
      store.subscribe(second);

      store.setSession(buildPrincipal(), {});
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);

      unsubscribeFirst();
      store.clear();
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(2);
    });

    it('exposes the current snapshot to the listener at notification time', () => {
      const principal = buildPrincipal();
      const seen: (string | null)[] = [];
      store.subscribe(() => {
        seen.push(store.get().principal?.id ?? null);
      });

      store.setSession(principal, {});
      store.clear();

      expect(seen).toEqual([principal.id, null]);
    });
  });

  describe('setSession', () => {
    it('publishes a new frozen snapshot holding the principal and flags', () => {
      const principal = buildPrincipal();
      const flags: FeatureFlagState = { 'contacts-module': true };

      store.setSession(principal, flags);

      const snapshot = store.get();
      expect(snapshot.principal).toBe(principal);
      expect(snapshot.flags).toEqual({ 'contacts-module': true });
      expect(Object.isFrozen(snapshot)).toBe(true);
    });

    it('replaces both the principal and the flags rather than merging them', () => {
      const first = buildPrincipal();
      const second = buildPrincipal();

      store.setSession(first, { 'contacts-module': true });
      store.setSession(second, { 'deals-module': true });

      const snapshot = store.get();
      expect(snapshot.principal).toBe(second);
      expect(snapshot.principal).not.toBe(first);
      expect(snapshot.flags).toEqual({ 'deals-module': true });
      expect(snapshot.flags['contacts-module']).toBeUndefined();
    });

    it('rejects a runtime write to the published snapshot', () => {
      store.setSession(buildPrincipal(), {});

      expect(() => Object.assign(store.get(), { principal: null })).toThrow(TypeError);
    });
  });

  describe('setActiveTenant', () => {
    it('is a no-op that does not notify while anonymous', () => {
      const listener = jest.fn();
      store.subscribe(listener);
      const before = store.get();

      store.setActiveTenant(buildTenantRef().id);

      expect(store.get()).toBe(before);
      expect(store.get().principal).toBeNull();
      expect(listener).not.toHaveBeenCalled();
    });

    // The store owns the invariant: an active tenant the principal does not belong to
    // would make every tenant-scoped policy check compare against unreachable data.
    it('refuses a tenant the principal does not belong to', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      store.setSession(buildPrincipal({ tenants }), {});
      const before = store.get();
      const listener = jest.fn();
      store.subscribe(listener);

      store.setActiveTenant(buildTenantRef().id);

      expect(store.get()).toBe(before);
      expect(store.get().principal?.tenantId).toBe(tenants[0].id);
      expect(listener).not.toHaveBeenCalled();
    });

    it('publishes a new frozen snapshot with only the tenant id changed', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ tenants });
      const flags: FeatureFlagState = { 'tenant-switcher': true };
      store.setSession(principal, flags);
      const before = store.get();

      store.setActiveTenant(tenants[1].id);

      const after = store.get();
      expect(after).not.toBe(before);
      expect(Object.isFrozen(after)).toBe(true);
      expect(after.principal).toEqual({ ...principal, tenantId: tenants[1].id });
      expect(after.principal?.tenantId).toBe(tenants[1].id);
      expect(after.principal?.id).toBe(principal.id);
      expect(after.principal?.email).toBe(principal.email);
      expect(after.principal?.roles).toEqual(principal.roles);
      expect(after.principal?.permissions).toEqual(principal.permissions);
      expect(after.principal?.tenants).toEqual(tenants);
      expect(after.flags).toEqual({ 'tenant-switcher': true });
    });

    it('leaves the previous snapshot and the source principal untouched', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      const principal = buildPrincipal({ tenants });
      store.setSession(principal, {});
      const before = store.get();

      store.setActiveTenant(tenants[1].id);

      expect(before.principal).toBe(principal);
      expect(before.principal?.tenantId).toBe(tenants[0].id);
      expect(principal.tenantId).toBe(tenants[0].id);
      expect(store.get().principal).not.toBe(principal);
    });

    it('notifies subscribers about the tenant change', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      store.setSession(buildPrincipal({ tenants }), {});
      const listener = jest.fn();
      store.subscribe(listener);

      store.setActiveTenant(tenants[1].id);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('resets to the anonymous snapshot and notifies', () => {
      const listener = jest.fn();
      store.setSession(buildPrincipal(), { 'contacts-module': true });
      store.subscribe(listener);

      store.clear();

      const snapshot = store.get();
      expect(snapshot).toEqual(ANONYMOUS_SNAPSHOT);
      expect(snapshot.principal).toBeNull();
      expect(snapshot.flags).toEqual({});
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('makes a subsequent setActiveTenant a no-op again', () => {
      const tenants = [buildTenantRef(), buildTenantRef()];
      store.setSession(buildPrincipal({ tenants }), {});
      store.clear();
      const cleared = store.get();

      store.setActiveTenant(tenants[1].id);

      expect(store.get()).toBe(cleared);
    });
  });
});

describe('accessState singleton', () => {
  beforeEach(() => {
    accessState.clear();
  });

  afterEach(() => {
    accessState.clear();
  });

  it('is an instance of AccessStateStore', () => {
    expect(accessState).toBeInstanceOf(AccessStateStore);
  });

  it('is anonymous after clear', () => {
    expect(accessState.get()).toEqual(ANONYMOUS_SNAPSHOT);
  });

  it('holds the session written through it', () => {
    const principal = buildPrincipal();

    accessState.setSession(principal, { 'deals-module': true });

    expect(accessState.get().principal).toBe(principal);
    expect(accessState.get().flags).toEqual({ 'deals-module': true });
  });
});
