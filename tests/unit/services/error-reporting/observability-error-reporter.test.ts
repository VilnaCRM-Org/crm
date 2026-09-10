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
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('falls back to the injected container-free core when no service is available', () => {
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error('render crash');

    new ObservabilityErrorReporter(undefined, observabilityCore).report(error, { surface: 'app' });

    expect(captureError).toHaveBeenCalledWith(error, { surface: 'app' });
  });

  it('reports nothing when neither the service nor the core is available', () => {
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();

    new ObservabilityErrorReporter().report(new Error('render crash'));

    expect(captureError).not.toHaveBeenCalled();
  });
});
