import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import ObservabilityErrorReporter from '@/services/error-reporting/observability-error-reporter';
import ERROR_REPORTING_TOKENS from '@/services/error-reporting/tokens';
import { AuthFailureMonitor } from '@/services/security-events/auth-failure-monitor';
import securityEventCore from '@/services/security-events/security-event-core';
import SECURITY_EVENT_TOKENS from '@/services/security-events/tokens';
import type { ErrorReporter } from '@/services/types/error-reporting';
import type { SecurityEventRecorder } from '@/services/types/security-events/security-event';

const resolveRecorder = (): SecurityEventRecorder =>
  container.resolve<SecurityEventRecorder>(SECURITY_EVENT_TOKENS.SecurityEventReporter);

describe('security-event DI surface (integration)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('routes every recorder method through the container-free core', () => {
    const authFailure = jest.spyOn(securityEventCore, 'authFailure').mockImplementation();
    const unauthorized = jest.spyOn(securityEventCore, 'unauthorizedResponse').mockImplementation();
    const boundary = jest.spyOn(securityEventCore, 'boundaryCatch').mockImplementation();
    const recorder = resolveRecorder();

    recorder.authFailure('registration', 'server');
    recorder.unauthorizedResponse(403);
    recorder.boundaryCatch('app');

    expect(authFailure).toHaveBeenCalledWith('registration', 'server');
    expect(unauthorized).toHaveBeenCalledWith(403);
    expect(boundary).toHaveBeenCalledWith('app');
  });

  it('resolves an ErrorReporter that reaches the observability boundary', async () => {
    const observabilityCore = (await import('@/services/observability/observability-core')).default;
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error('boundary crash');

    container
      .resolve<ErrorReporter>(ERROR_REPORTING_TOKENS.ErrorReporter)
      .report(error, { surface: 'app' });

    expect(captureError).toHaveBeenCalledWith(error, { surface: 'app' });
  });

  it('falls back to the container-free core when resolved without the DI graph', async () => {
    const observabilityCore = (await import('@/services/observability/observability-core')).default;
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();
    const error = new Error('standalone crash');

    new ObservabilityErrorReporter().report(error);

    expect(captureError).toHaveBeenCalledWith(error, undefined);
  });

  it('caps the tracked auth failures so a sustained burst cannot grow unbounded', () => {
    const monitor = new AuthFailureMonitor();
    let observed = { failureCount: 0 };

    for (let index = 0; index < 1500; index += 1) observed = monitor.observe(Date.now());

    expect(observed.failureCount).toBe(1000);
  });
});
