import type authFailureMonitor from '@/services/security-events/auth-failure-monitor';
import loadIsolated from '@tests/unit/utils/isolated-module';

const THRESHOLD_VAR = 'REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD';
const WINDOW_VAR = 'REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS';

// The tracked-failure cap is a module-level constant, so the module is evaluated inside the
// test body to keep a mutant in it reachable by an assertion (issue #171).
const loadMonitor = (): Promise<typeof authFailureMonitor> =>
  loadIsolated(async () => {
    const { AuthFailureMonitor } = await import('@/services/security-events/auth-failure-monitor');
    return new AuthFailureMonitor();
  });

describe('AuthFailureMonitor', () => {
  const original = { threshold: process.env[THRESHOLD_VAR], window: process.env[WINDOW_VAR] };

  beforeEach(() => {
    process.env[THRESHOLD_VAR] = '3';
    process.env[WINDOW_VAR] = '1000';
  });

  afterEach(() => {
    process.env[THRESHOLD_VAR] = original.threshold;
    process.env[WINDOW_VAR] = original.window;
    jest.restoreAllMocks();
  });

  it('reports the configured threshold and window with every observation', async () => {
    const monitor = await loadMonitor();

    expect(monitor.observe(1000)).toEqual({
      failureCount: 1,
      windowMs: 1000,
      threshold: 3,
      thresholdBreached: false,
    });
  });

  it('breaches only once the threshold is reached inside the window', async () => {
    const monitor = await loadMonitor();

    expect(monitor.observe(1000).thresholdBreached).toBe(false);
    expect(monitor.observe(1100).thresholdBreached).toBe(false);
    expect(monitor.observe(1200)).toMatchObject({ failureCount: 3, thresholdBreached: true });
  });

  it('drops failures that fell out of the rolling window', async () => {
    const monitor = await loadMonitor();
    monitor.observe(1000);
    monitor.observe(1100);

    expect(monitor.observe(5000)).toMatchObject({ failureCount: 1, thresholdBreached: false });
  });

  it('keeps a failure that is exactly on the window boundary', async () => {
    const monitor = await loadMonitor();
    monitor.observe(1000);

    expect(monitor.observe(2000).failureCount).toBe(2);
  });

  it('caps the tracked failures so a sustained burst cannot grow unbounded', async () => {
    process.env[WINDOW_VAR] = '10000000';
    const monitor = await loadMonitor();
    let observed = { failureCount: 0 };

    for (let index = 0; index < 1200; index += 1) observed = monitor.observe(index);

    expect(observed.failureCount).toBe(1000);
  });

  it('stamps the observation with the current time when none is supplied', async () => {
    const monitor = await loadMonitor();
    jest.spyOn(Date, 'now').mockReturnValue(4242);

    expect(monitor.observe().failureCount).toBe(1);
    expect(Date.now).toHaveBeenCalled();
  });
});
