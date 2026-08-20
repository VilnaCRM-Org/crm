import 'reflect-metadata';

import ObservabilityErrorReporter from '@/services/error-reporting/observability-error-reporter';
import observabilityCore from '@/services/observability/observability-core';
import type { ObservabilityService } from '@/services/types/observability/observability';

const buildObservability = (): ObservabilityService =>
  ({
    init: jest.fn(),
    captureError: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    reportVital: jest.fn(),
  }) as unknown as ObservabilityService;

describe('ObservabilityErrorReporter', () => {
  it('forwards a reported error and its context to the observability boundary', () => {
    const observability = buildObservability();
    const error = new Error('render crash');

    new ObservabilityErrorReporter(observability).report(error, { componentStack: 'at App' });

    expect(observability.captureError).toHaveBeenCalledWith(error, { componentStack: 'at App' });
  });

  it('forwards an error reported without context', () => {
    const observability = buildObservability();
    const error = new Error('render crash');

    new ObservabilityErrorReporter(observability).report(error);

    expect(observability.captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('falls back to the container-free core when no service is injected', () => {
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error('render crash');

    new ObservabilityErrorReporter().report(error, { surface: 'app' });

    expect(captureError).toHaveBeenCalledWith(error, { surface: 'app' });
    captureError.mockRestore();
  });
});
