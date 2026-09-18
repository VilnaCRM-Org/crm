import type { ConnectivityStateVar } from './connectivity-state-var';
import type { ConnectivityHost } from './types/connectivity-state';

// Binds the browser's online/offline signal to the connectivity var. `attach` reads the current
// flag first, so a page that boots offline is offline from its first paint, and returns the
// detach so a test (or a future teardown) can unbind (issue #147).
export default class BrowserConnectivityAdapter {
  constructor(private readonly connectivity: ConnectivityStateVar) {}

  public attach(host: ConnectivityHost): () => void {
    const sync = (): void => this.connectivity.setOnline(host.navigator.onLine);
    sync();
    host.addEventListener('online', sync);
    host.addEventListener('offline', sync);

    return (): void => {
      host.removeEventListener('online', sync);
      host.removeEventListener('offline', sync);
    };
  }
}
