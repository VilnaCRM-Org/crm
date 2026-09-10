import 'reflect-metadata';

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

const tick = async (): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

// `observabilityCore.init()` is fire-and-forget over a dynamic `import()`, so the tests have to
// wait for the SDK to actually arrive. Waiting on the SDK's own arrival rather than on a fixed
// number of microtasks keeps the suite correct if another `await` is ever added to that path, and
// makes a never-loading SDK a loud failure instead of an `undefined` mock call.
const untilSdkLoaded = async (Sentry: Chain['Sentry'], attempts: number = 50): Promise<void> => {
  if ((Sentry.init as jest.Mock).mock.calls.length > 0) return;
  if (attempts === 0) throw new Error('Sentry SDK was never initialised');
  await tick();
  await untilSdkLoaded(Sentry, attempts - 1);
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
    await untilSdkLoaded(Sentry);

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
    await untilSdkLoaded(Sentry);

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
      thresholdCrossed: true,
    });
  });

  // The payload is credential-free by construction, not by filtering: `authFailure` takes two
  // closed unions, so no caller can route a credential into it. Asserting the exact key set is
  // what pins that — a later field that could carry user input fails here. The `beforeSend`
  // scrubber is the second line of defence and is covered at its own boundary, which is also the
  // only place it runs: this mock observes `captureException` arguments before `beforeSend`.
  it('emits a closed payload shape that has no field a credential could ride in', async () => {
    const { Sentry, securityEventCore, observabilityCore } = await loadChain();
    observabilityCore.init();
    await untilSdkLoaded(Sentry);

    securityEventCore.authFailure('login', 'authentication');

    const [, hint] = (Sentry.captureException as jest.Mock).mock.calls.at(-1) as [
      Error,
      { extra: Record<string, unknown> },
    ];
    // `X-Request-Id` is absent by design: `observabilityCore.withCorrelation` attaches it only
    // when a request id is in flight, and an auth failure raised from the store is not inside one.
    expect(Object.keys(hint.extra).sort()).toEqual([
      'X-Correlation-Id',
      'category',
      'event',
      'failureCount',
      'reason',
      'severity',
      'threshold',
      'thresholdCrossed',
      'windowMs',
    ]);
  });

  it('buffers a security event raised before the SDK finished loading', async () => {
    const { Sentry, securityEventCore, observabilityCore } = await loadChain();

    securityEventCore.boundaryCatch('app');
    expect(Sentry.captureException as jest.Mock).not.toHaveBeenCalled();

    observabilityCore.init();
    await untilSdkLoaded(Sentry);

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
    await tick();

    securityEventCore.unauthorizedResponse(401);
    await tick();

    expect(Sentry.init as jest.Mock).not.toHaveBeenCalled();
    expect(Sentry.captureException as jest.Mock).not.toHaveBeenCalled();
  });
});
