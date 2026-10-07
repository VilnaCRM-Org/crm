import type { ModuleLoader } from './types/module-loader';
import type { PrefetchHost, PrefetchHostEvent } from './types/prefetch-host';

export default class PostLoadPrefetcher {
  private readonly intentEvents: readonly PrefetchHostEvent[] = ['pointerdown', 'keydown'];

  private attached = false;

  private started = false;

  constructor(private readonly targets: readonly ModuleLoader<unknown>[]) {}

  public attach(host: PrefetchHost): void {
    if (this.attached) return;
    this.attached = true;

    if (host.document.readyState === 'complete') {
      this.awaitIntent(host);
      return;
    }

    host.addEventListener('load', () => this.awaitIntent(host), { once: true });
  }

  private awaitIntent(host: PrefetchHost): void {
    this.intentEvents.forEach((type) => {
      host.addEventListener(type, () => this.start(host), { once: true, passive: true });
    });
  }

  private start(host: PrefetchHost): void {
    if (this.started) return;
    this.started = true;
    this.prefetch(host);
  }

  private prefetch(host: PrefetchHost): void {
    if (!host.navigator.onLine) {
      host.addEventListener('online', () => this.prefetch(host), { once: true });
      return;
    }

    this.targets.forEach((target) => {
      target.load().catch(() => undefined);
    });
  }
}
