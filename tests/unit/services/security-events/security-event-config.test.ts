import type securityEventConfigInstance from '@/services/security-events/security-event-config';
import loadIsolated from '@tests/unit/utils/isolated-module';

const THRESHOLD_VAR = 'REACT_APP_AUTH_FAILURE_ALERT_THRESHOLD';
const WINDOW_VAR = 'REACT_APP_AUTH_FAILURE_ALERT_WINDOW_MS';

// The defaults live in module-level constants, so the module has to be evaluated inside the
// test body for a mutant in them to be reachable by an assertion (issue #171).
const loadConfig = (): Promise<typeof securityEventConfigInstance> =>
  loadIsolated(
    async () => (await import('@/services/security-events/security-event-config')).default
  );

describe('SecurityEventConfig', () => {
  const original = { threshold: process.env[THRESHOLD_VAR], window: process.env[WINDOW_VAR] };

  afterEach(() => {
    process.env[THRESHOLD_VAR] = original.threshold;
    process.env[WINDOW_VAR] = original.window;
  });

  it('reads the configured alert threshold and window', async () => {
    process.env[THRESHOLD_VAR] = '9';
    process.env[WINDOW_VAR] = '15000';
    const config = await loadConfig();

    expect(config.threshold()).toBe(9);
    expect(config.windowMs()).toBe(15000);
  });

  it('falls back to the documented defaults when the variables are unset', async () => {
    delete process.env[THRESHOLD_VAR];
    delete process.env[WINDOW_VAR];
    const config = await loadConfig();

    expect(config.threshold()).toBe(5);
    expect(config.windowMs()).toBe(60000);
  });

  it('falls back to the documented defaults for a blank variable', async () => {
    process.env[THRESHOLD_VAR] = '   ';
    process.env[WINDOW_VAR] = '';
    const config = await loadConfig();

    expect(config.threshold()).toBe(5);
    expect(config.windowMs()).toBe(60000);
  });

  it.each([
    ['not-a-number', 5, 60000],
    ['0', 5, 60000],
    ['-3', 5, 60000],
    ['2.5', 2, 2],
  ])('normalizes %s to a positive integer', async (raw, threshold, windowMs) => {
    process.env[THRESHOLD_VAR] = raw;
    process.env[WINDOW_VAR] = raw;
    const config = await loadConfig();

    expect(config.threshold()).toBe(threshold);
    expect(config.windowMs()).toBe(windowMs);
  });
});
