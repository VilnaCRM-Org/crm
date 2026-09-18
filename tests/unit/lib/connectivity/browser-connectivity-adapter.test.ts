import BrowserConnectivityAdapter from '@/lib/connectivity/browser-connectivity-adapter';
import { ConnectivityStateVar } from '@/lib/connectivity/connectivity-state-var';
import type { ConnectivityHost } from '@/lib/connectivity/types/connectivity-state';

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
  it('reads the current flag on attach so a page that boots offline starts offline', () => {
    const connectivity = new ConnectivityStateVar();
    const host = createHost(false);

    new BrowserConnectivityAdapter(connectivity).attach(host);

    expect(connectivity.get()).toEqual({ online: false });
  });

  it('follows the offline and online events', () => {
    const connectivity = new ConnectivityStateVar();
    const host = createHost(true);
    new BrowserConnectivityAdapter(connectivity).attach(host);

    host.navigator.onLine = false;
    host.fire('offline');
    expect(connectivity.get()).toEqual({ online: false });

    host.navigator.onLine = true;
    host.fire('online');
    expect(connectivity.get()).toEqual({ online: true });
  });

  it('trusts the navigator flag over the event name', () => {
    const connectivity = new ConnectivityStateVar();
    const host = createHost(true);
    new BrowserConnectivityAdapter(connectivity).attach(host);

    host.navigator.onLine = false;
    host.fire('online');

    expect(connectivity.get()).toEqual({ online: false });
  });

  it('registers one listener per event and removes both on detach', () => {
    const connectivity = new ConnectivityStateVar();
    const host = createHost(true);

    const detach = new BrowserConnectivityAdapter(connectivity).attach(host);
    expect(host.listeners('online')).toBe(1);
    expect(host.listeners('offline')).toBe(1);

    detach();
    expect(host.listeners('online')).toBe(0);
    expect(host.listeners('offline')).toBe(0);

    host.navigator.onLine = false;
    host.fire('offline');
    expect(connectivity.get()).toEqual({ online: true });
  });

  it('works against the real window in jsdom', () => {
    const connectivity = new ConnectivityStateVar();
    const detach = new BrowserConnectivityAdapter(connectivity).attach(window);

    expect(connectivity.get()).toEqual({ online: window.navigator.onLine });
    detach();
  });
});
