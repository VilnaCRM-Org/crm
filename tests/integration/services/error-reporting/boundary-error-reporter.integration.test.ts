import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';
import ERROR_REPORTING_TOKENS from '@/services/error-reporting/tokens';
import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';
import SecurityEventSignal from '@/services/security-events/security-event-signal';
import type { ErrorReporter } from '@/services/types/error-reporting';
import { buildToken } from '@tests/builders';

const resolveReporter = (): ErrorReporter =>
  container.resolve<ErrorReporter>(ERROR_REPORTING_TOKENS.BoundaryErrorReporter);

describe('BoundaryErrorReporter (integration)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('resolves from the aggregator to the very instance the shell passes by prop', () => {
    expect(resolveReporter()).toBe(boundaryErrorReporter);
  });

  it('records the app surface by default and captures through the observability core', () => {
    const boundaryCatch = jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation();
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error(buildToken());
    const context = { componentStack: `\n    at ${buildToken()}` };

    resolveReporter().report(error, context);

    expect(boundaryCatch).toHaveBeenCalledWith('app');
    expect(captureError).toHaveBeenCalledWith(error, context);
  });

  it('records the route surface named by the router seam', () => {
    const boundaryCatch = jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation();
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error(buildToken());

    resolveReporter().report(error, { surface: 'route' });

    expect(boundaryCatch).toHaveBeenCalledWith('route');
    expect(captureError).toHaveBeenCalledWith(error, { surface: 'route' });
  });

  it('drives the real security-event chain so the signal reaches observability first', () => {
    const report = jest.spyOn(observabilityCore, 'report').mockImplementation();
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error(buildToken());

    resolveReporter().report(error, { surface: 'auth' });

    const [signal, payload] = report.mock.calls[0] ?? [];
    expect(signal).toBeInstanceOf(SecurityEventSignal);
    expect(payload).toEqual({
      event: 'error_boundary_catch',
      category: 'render',
      reason: 'auth',
      severity: 'warning',
    });
    expect(captureError).toHaveBeenCalledWith(error, { surface: 'auth' });
    const [signalOrder] = report.mock.invocationCallOrder;
    const [captureOrder] = captureError.mock.invocationCallOrder;
    expect(signalOrder).toBeLessThan(captureOrder ?? Number.NEGATIVE_INFINITY);
  });
});
