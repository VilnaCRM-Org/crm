import * as webVitals from 'web-vitals';

import webVitalsReporter, { WebVitalsReporter } from '@/services/observability/web-vitals-reporter';

jest.mock('web-vitals', () => ({
  onLCP: jest.fn(),
  onINP: jest.fn(),
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onTTFB: jest.fn(),
}));

describe('WebVitalsReporter', () => {
  it('subscribes the handler to every web-vitals signal', async () => {
    const reporter = new WebVitalsReporter();
    const handler = jest.fn();

    await reporter.subscribe(handler);

    const registrars = [
      webVitals.onLCP,
      webVitals.onINP,
      webVitals.onCLS,
      webVitals.onFCP,
      webVitals.onTTFB,
    ];
    for (const register of registrars) {
      expect(register).toHaveBeenCalledWith(handler);
    }
  });

  it('exports a shared singleton instance', () => {
    expect(webVitalsReporter).toBeInstanceOf(WebVitalsReporter);
  });
});
