import 'reflect-metadata';

import { buildEmail, buildPassword, buildToken } from '@tests/builders';

jest.mock('@sentry/react', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

jest.mock('web-vitals', () => {
  const register = (): void => {};
  return { onLCP: register, onINP: register, onCLS: register, onFCP: register, onTTFB: register };
});

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

type Chain = {
  Sentry: typeof import('@sentry/react');
  securityEventCore: typeof import('@/services/security-events/security-event-core').default;
  observabilityCore: typeof import('@/services/observability/observability-core').default;
  sessionCorrelation: typeof import('@/services/observability/session-correlation').default;
};

const loadChain = async (): Promise<Chain> => ({
  Sentry: await import('@sentry/react'),
  securityEventCore: (await import('@/services/security-events/security-event-core')).default,
  observabilityCore: (await import('@/services/observability/observability-core')).default,
  sessionCorrelation: (await import('@/services/observability/session-correlation')).default,
});

describe('security-event chain (integration)', () => {
  const originalDsn = process.env.REACT_APP_SENTRY_DSN;
  const originalThreshold = process.env.REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
  });

  afterEach(() => {
    process.env.REACT_APP_SENTRY_DSN = originalDsn;
    process.env.REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD = originalThreshold;
  });

  it('delivers an auth_failure to Sentry with the session correlation id attached', async () => {
    const { Sentry, securityEventCore, observabilityCore, sessionCorrelation } = await loadChain();
    observabilityCore.init();
    await flush();

    securityEventCore.authFailure('login', 'authentication');

    const [signal, hint] = (Sentry.captureException as jest.Mock).mock.calls.at(-1) as [
      Error,
      { extra: Record<string, unknown> },
    ];
    expect(signal.name).toBe('SecurityEventSignal');
    expect(signal.message).toBe('security.auth_failure');
    expect(hint.extra).toMatchObject({
      event: 'auth_failure',
      category: 'login',
      reason: 'authentication',
      severity: 'warning',
      'X-Correlation-Id': sessionCorrelation.id(),
    });
  });

  it('escalates to auth_failure_burst once the configured threshold is reached', async () => {
    process.env.REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD = '3';
    const { Sentry, securityEventCore, observabilityCore } = await loadChain();
    observabilityCore.init();
    await flush();

    securityEventCore.authFailure('login', 'authentication');
    securityEventCore.authFailure('login', 'authentication');
    securityEventCore.authFailure('login', 'authentication');

    const events = (Sentry.captureException as jest.Mock).mock.calls.map(
      ([, hint]) => (hint as { extra: Record<string, unknown> }).extra
    );
    expect(events.map((extra) => extra.event)).toEqual([
      'auth_failure',
      'auth_failure',
      'auth_failure_burst',
    ]);
    expect(events.at(-1)).toMatchObject({
      severity: 'critical',
      threshold: 3,
      failureCount: 3,
      thresholdBreached: true,
    });
  });

  it('scrubs credential-shaped values before the event leaves the process', async () => {
    const { Sentry, securityEventCore, observabilityCore } = await loadChain();
    const password = buildPassword();
    const token = buildToken();
    const email = buildEmail();
    observabilityCore.init();
    await flush();

    securityEventCore.authFailure('login', 'authentication');

    const serialized = JSON.stringify((Sentry.captureException as jest.Mock).mock.calls.at(-1));
    expect(serialized).not.toContain(password);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain(email);
  });

  it('buffers a security event raised before the SDK finished loading', async () => {
    const { Sentry, securityEventCore, observabilityCore } = await loadChain();

    securityEventCore.boundaryCatch('app');
    expect(Sentry.captureException as jest.Mock).not.toHaveBeenCalled();

    observabilityCore.init();
    await flush();

    const [, hint] = (Sentry.captureException as jest.Mock).mock.calls.at(-1) as [
      Error,
      { extra: Record<string, unknown> },
    ];
    expect(hint.extra).toMatchObject({ event: 'error_boundary_catch', reason: 'app' });
  });

  it('is a verified no-op when no Sentry DSN is configured', async () => {
    process.env.REACT_APP_SENTRY_DSN = '';
    const { Sentry, securityEventCore, observabilityCore } = await loadChain();
    observabilityCore.init();
    await flush();

    securityEventCore.unauthorizedResponse(401);
    await flush();

    expect(Sentry.init as jest.Mock).not.toHaveBeenCalled();
    expect(Sentry.captureException as jest.Mock).not.toHaveBeenCalled();
  });
});
