import 'reflect-metadata';

import type observabilityCoreInstance from '@/services/observability/observability-core';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type { SecurityEventRecorder } from '@/services/types/security-events/security-event';
import type { ChallengeFailureReason, ChallengeResult } from '@auth/types/two-factor/challenge';
import AuthSecuritySignals from '@auth/utils/auth-security-signals';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const buildRecorder = (): SecurityEventRecorder => ({
  authFailure: jest.fn(),
  unauthorizedResponse: jest.fn(),
  boundaryCatch: jest.fn(),
});

const buildObservability = (): ObservabilityService =>
  ({
    init: jest.fn(),
    captureError: jest.fn(),
    setUser: jest.fn(),
    clearUser: jest.fn(),
    reportVital: jest.fn(),
  }) as unknown as ObservabilityService;

const failed = (reason: ChallengeFailureReason): ChallengeResult => ({ kind: 'failed', reason });

describe('AuthSecuritySignals.challengeSettled', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tags an opaque session identity once for a completed challenge and records nothing', () => {
    const observability = buildObservability();
    const recorder = buildRecorder();
    const token = buildToken();

    new AuthSecuritySignals(recorder, observability).challengeSettled({
      kind: 'completed',
      token,
      recoveryCodesRemaining: 1,
    });

    expect(observability.setUser).toHaveBeenCalledTimes(1);
    const [identity] = (observability.setUser as jest.Mock).mock.calls[0] as [{ id: string }];
    expect(identity.id).toHaveLength(36);
    expect(JSON.stringify(identity)).not.toContain(token);
    expect(recorder.authFailure).not.toHaveBeenCalled();
  });

  it.each<ChallengeFailureReason>([
    'invalid_code',
    'expired_session',
    'locked',
    'rate_limited',
    'network',
    'server',
  ])('records one login auth_failure with the %s reason', (reason) => {
    const observability = buildObservability();
    const recorder = buildRecorder();

    new AuthSecuritySignals(recorder, observability).challengeSettled(failed(reason));

    expect(recorder.authFailure).toHaveBeenCalledTimes(1);
    expect(recorder.authFailure).toHaveBeenCalledWith('login', reason);
    expect(observability.setUser).not.toHaveBeenCalled();
  });

  it('makes the fifth invalid code inside the window an auth_failure_burst', async () => {
    const { signals, report } = await loadIsolated(async () => {
      const core = (await import('@/services/observability/observability-core')).default;
      const recorder = (await import('@/services/security-events/security-event-core')).default;
      const Signals = (await import('@auth/utils/auth-security-signals')).default;
      return {
        signals: new Signals(recorder, buildObservability()),
        report: jest.spyOn(core as typeof observabilityCoreInstance, 'report').mockImplementation(),
      };
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      signals.challengeSettled(failed('invalid_code'));
    }

    const payloads = report.mock.calls.map(([, payload]) => payload as Record<string, unknown>);
    expect(payloads.map((payload) => payload['event'])).toEqual([
      'auth_failure',
      'auth_failure',
      'auth_failure',
      'auth_failure',
      'auth_failure_burst',
    ]);
    expect(payloads[4]).toEqual({
      event: 'auth_failure_burst',
      category: 'login',
      reason: 'invalid_code',
      severity: 'critical',
      failureCount: 5,
      windowMs: expect.any(Number),
      threshold: 5,
      thresholdCrossed: true,
    });
    expect(Object.keys(payloads[0] ?? {}).sort()).toEqual(
      [
        'category',
        'event',
        'failureCount',
        'reason',
        'severity',
        'thresholdCrossed',
        'threshold',
        'windowMs',
      ].sort()
    );
  });
});
