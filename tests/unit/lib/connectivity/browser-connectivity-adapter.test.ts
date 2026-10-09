import BrowserConnectivityAdapter from '@/lib/connectivity/browser-connectivity-adapter';
import type { ConnectivityHost } from '@/lib/connectivity/types/connectivity-state';
import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import { resetClientStores } from '@tests/utils/reset-client-stores';

type FakeHost = ConnectivityHost & {
  navigator: { onLine: boolean };
  fire(type: 'online' | 'offline'): void;
  listeners(type: 'online' | 'offline'): number;
};

const createHost = (onLine: boolean): FakeHost => {
  const registry: Record<'online' | 'offline', Set<() => void>> = {
    online: new Set(),
    offline: new Set(),
  };
  return {
    navigator: { onLine },
    addEventListener: (type, listener): void => {
      registry[type].add(listener);
    },
    removeEventListener: (type, listener): void => {
      registry[type].delete(listener);
    },
    fire: (type): void => {
      registry[type].forEach((listener) => listener());
    },
    listeners: (type): number => registry[type].size,
  };
};

describe('BrowserConnectivityAdapter', () => {
  beforeEach(() => resetClientStores());

  it('reads the current flag on attach so a page that boots offline starts offline', () => {
    const connectivity = useConnectivityStore;
    const host = createHost(false);

    new BrowserConnectivityAdapter(connectivity).attach(host);

    expect(connectivity.getState()).toEqual({ online: false });
  });

  it('follows the offline and online events', () => {
    const connectivity = useConnectivityStore;
    const host = createHost(true);
    new BrowserConnectivityAdapter(connectivity).attach(host);

    host.navigator.onLine = false;
    host.fire('offline');
    expect(connectivity.getState()).toEqual({ online: false });

    host.navigator.onLine = true;
    host.fire('online');
    expect(connectivity.getState()).toEqual({ online: true });
  });

  it('trusts the navigator flag over the event name', () => {
    const connectivity = useConnectivityStore;
    const host = createHost(true);
    new BrowserConnectivityAdapter(connectivity).attach(host);

    host.navigator.onLine = false;
    host.fire('online');

    expect(connectivity.getState()).toEqual({ online: false });
  });

  it('registers one listener per event and removes both on detach', () => {
    const connectivity = useConnectivityStore;
    const host = createHost(true);

    const detach = new BrowserConnectivityAdapter(connectivity).attach(host);
    expect(host.listeners('online')).toBe(1);
    expect(host.listeners('offline')).toBe(1);

    detach();
    expect(host.listeners('online')).toBe(0);
    expect(host.listeners('offline')).toBe(0);

    host.navigator.onLine = false;
    host.fire('offline');
    expect(connectivity.getState()).toEqual({ online: true });
  });

  it('works against the real window in jsdom', () => {
    const connectivity = useConnectivityStore;
    const detach = new BrowserConnectivityAdapter(connectivity).attach(window);

    expect(connectivity.getState()).toEqual({ online: window.navigator.onLine });
    detach();
  });
});
