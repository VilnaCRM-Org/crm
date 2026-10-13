import type { StoreApi } from 'zustand';

import type { ConnectivityHost, ConnectivityState } from './types/connectivity-state';

// Binds the browser's online/offline signal to the connectivity store. `attach` reads the current
// flag first, so a page that boots offline is offline from its first paint, and returns the
// detach so a test (or a future teardown) can unbind (issue #147).
export default class BrowserConnectivityAdapter {
  constructor(private readonly connectivity: StoreApi<ConnectivityState>) {}

  public attach(host: ConnectivityHost): () => void {
    const sync = (): void => {
      const online = host.navigator.onLine;
      this.connectivity.setState((state: ConnectivityState): ConnectivityState =>
        state.online === online ? state : { online }
      );
    };
    sync();
    host.addEventListener('online', sync);
    host.addEventListener('offline', sync);

    return (): void => {
      host.removeEventListener('online', sync);
      host.removeEventListener('offline', sync);
    };
  }
}
