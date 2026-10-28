import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import observabilityCore from '@/services/observability/observability-core';
import securityEventCore from '@/services/security-events/security-event-core';
import SecurityEventSignal from '@/services/security-events/security-event-signal';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

const resolveSignals = (): AuthSecuritySignals =>
  container.resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals);

describe('auth security signals (integration)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['a structured auth error', { kind: 'authentication' }, 'authentication'],
    ['an unmapped kind', { kind: 'teapot' }, 'unknown'],
    ['a bare string rejection', 'boom', 'unknown'],
    ['a null rejection', null, 'unknown'],
    ['an undefined rejection', undefined, 'unknown'],
    ['a rate-limited rejection', { status: 429, kind: 'server' }, 'rate_limited'],
    ['a non-numeric status', { status: '429', kind: 'network' }, 'network'],
    ['a locked rejection', { status: 423, kind: 'authentication' }, 'locked'],
  ])('classifies %s as %s', (_label, error, reason) => {
    const authFailure = jest.spyOn(securityEventCore, 'authFailure').mockImplementation();

    resolveSignals().registerFailed(error);

    expect(authFailure).toHaveBeenCalledWith('registration', reason);
  });

  it('classifies a registration rejection under the registration category', () => {
    const authFailure = jest.spyOn(securityEventCore, 'authFailure').mockImplementation();

    resolveSignals().registerFailed({ kind: 'conflict' });

    expect(authFailure).toHaveBeenCalledWith('registration', 'conflict');
  });

  it('records a locked sign-in under the login category through the container', () => {
    const report = jest.spyOn(observabilityCore, 'report').mockImplementation();

    resolveSignals().loginSettled({
      ok: false,
      error: {
        kind: 'authentication',
        displayMessage: 'sign_in.errors.locked',
        retryable: false,
        status: 423,
        reason: 'locked',
      },
    });

    expect(report).toHaveBeenCalledTimes(1);
    const [signal, payload] = report.mock.calls[0] ?? [];
    expect(signal).toBeInstanceOf(SecurityEventSignal);
    expect(payload).toEqual({
      event: 'auth_failure',
      category: 'login',
      reason: 'locked',
      severity: 'warning',
      failureCount: 1,
      windowMs: expect.any(Number),
      threshold: expect.any(Number),
      thresholdCrossed: false,
    });
  });

  it('tags an opaque identity on a successful login without leaking an address', () => {
    const setUser = jest.spyOn(observabilityCore, 'setUser').mockImplementation();

    resolveSignals().loginSettled({
      ok: true,
      value: { kind: 'session', email: 'user@example.com', token: 'session-token' },
    });

    const identity = setUser.mock.calls[0]?.[0] as { id: string };
    expect(identity.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.keys(identity)).toEqual(['id']);
  });
});
