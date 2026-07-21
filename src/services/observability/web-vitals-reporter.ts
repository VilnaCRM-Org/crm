import type { WebVitalHandler, WebVitalsModule } from '@/services/types/observability/sentry';

export class WebVitalsReporter {
  public async subscribe(handler: WebVitalHandler): Promise<void> {
    const module = await this.load();
    module.onLCP(handler);
    module.onINP(handler);
    module.onCLS(handler);
    module.onFCP(handler);
    module.onTTFB(handler);
  }

  private async load(): Promise<WebVitalsModule> {
    const module = await import('web-vitals');
    return module as unknown as WebVitalsModule;
  }
}

const webVitalsReporter = new WebVitalsReporter();

export default webVitalsReporter;
