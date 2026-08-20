import observabilityCore from '@/services/observability/observability-core';
import authFailureMonitor from '@/services/security-events/auth-failure-monitor';
import { SecurityEventCore } from '@/services/security-events/security-event-core';
import SecurityEventSignal from '@/services/security-events/security-event-signal';
import type { AuthFailureWindow } from '@/services/types/security-events/security-event';

const quiet: AuthFailureWindow = {
  failureCount: 2,
  windowMs: 60000,
  threshold: 5,
  thresholdBreached: false,
};

const burst: AuthFailureWindow = { ...quiet, failureCount: 5, thresholdBreached: true };

describe('SecurityEventCore', () => {
  let report: jest.SpyInstance;

  beforeEach(() => {
    report = jest.spyOn(observabilityCore, 'report').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const lastCall = (): [SecurityEventSignal, Record<string, unknown>] =>
    report.mock.calls.at(-1) as [SecurityEventSignal, Record<string, unknown>];

  it('emits a warning-level auth_failure below the alert threshold', () => {
    jest.spyOn(authFailureMonitor, 'observe').mockReturnValue(quiet);

    new SecurityEventCore().authFailure('login', 'authentication');

    const [signal, payload] = lastCall();
    expect(signal).toBeInstanceOf(SecurityEventSignal);
    expect(signal.event).toBe('auth_failure');
    expect(payload).toEqual({
      event: 'auth_failure',
      category: 'login',
      reason: 'authentication',
      severity: 'warning',
      failureCount: 2,
      windowMs: 60000,
      threshold: 5,
      thresholdBreached: false,
    });
  });

  it('escalates to a critical auth_failure_burst once the threshold is breached', () => {
    jest.spyOn(authFailureMonitor, 'observe').mockReturnValue(burst);

    new SecurityEventCore().authFailure('registration', 'validation');

    const [signal, payload] = lastCall();
    expect(signal.event).toBe('auth_failure_burst');
    expect(payload).toMatchObject({
      event: 'auth_failure_burst',
      category: 'registration',
      reason: 'validation',
      severity: 'critical',
      failureCount: 5,
      thresholdBreached: true,
    });
  });

  it('never carries a credential, token, or identifier in the auth-failure payload', () => {
    jest.spyOn(authFailureMonitor, 'observe').mockReturnValue(quiet);

    new SecurityEventCore().authFailure('login', 'authentication');

    const serialized = JSON.stringify(lastCall()[1]);
    expect(Object.keys(lastCall()[1])).toEqual(
      expect.not.arrayContaining(['password', 'token', 'email', 'authorization', 'userId'])
    );
    expect(serialized).not.toMatch(/@/);
  });

  it('emits a transport event for an unauthorized response status', () => {
    new SecurityEventCore().unauthorizedResponse(403);

    expect(lastCall()[1]).toEqual({
      event: 'unauthorized_response',
      category: 'transport',
      reason: 'http_403',
      severity: 'warning',
    });
  });

  it('emits a render event for an error-boundary catch', () => {
    new SecurityEventCore().boundaryCatch('auth');

    expect(lastCall()[1]).toEqual({
      event: 'error_boundary_catch',
      category: 'render',
      reason: 'auth',
      severity: 'warning',
    });
  });
});
