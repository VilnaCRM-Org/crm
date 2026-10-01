import type { ModuleLoader } from './types/module-loader';
import type { PrefetchHost } from './types/prefetch-host';

const PREFETCH_DELAY_MS = 2000;

export default class PostLoadPrefetcher {
  private attached = false;

  constructor(private readonly targets: readonly ModuleLoader<unknown>[]) {}

  public attach(host: PrefetchHost): void {
    if (this.attached) return;
    this.attached = true;

    if (host.document.readyState === 'complete') {
      this.schedule(host);
      return;
    }

    host.addEventListener('load', () => this.schedule(host), { once: true });
  }

  private schedule(host: PrefetchHost): void {
    host.setTimeout(() => this.prefetch(host), PREFETCH_DELAY_MS);
  }

  private prefetch(host: PrefetchHost): void {
    if (!host.navigator.onLine) {
      host.addEventListener('online', () => this.schedule(host), { once: true });
      return;
    }

    this.targets.forEach((target) => {
      target.load().catch(() => undefined);
    });
  }
}
