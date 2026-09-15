import type { RecoverableError } from '@/lib/reliability/types/recoverable-error';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type GuardModule = typeof import('@/lib/reliability/recoverable-error-guard');

// The strategy and severity tables are module-level literals, so the module is loaded inside each
// test to keep a mutant in either table reachable by an assertion (issue #171).
const loadGuard = (): Promise<GuardModule> =>
  loadIsolated(() => import('@/lib/reliability/recoverable-error-guard'));

const buildRecoverable = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  recoverable: true,
  strategy: 'retry',
  messageKey: 'error_boundary.retryable',
  severity: 'error',
  ...overrides,
});

describe('RecoverableErrorGuard', () => {
  it('exports the guard as a module singleton', async () => {
    const { default: guard, RecoverableErrorGuard } = await loadGuard();

    expect(guard).toBeInstanceOf(RecoverableErrorGuard);
  });

  it.each(['retry', 'reset', 'reload', 'navigate-home', 'none'])(
    'accepts the %s strategy',
    async (strategy) => {
      const { default: guard } = await loadGuard();

      expect(guard.is(buildRecoverable({ strategy }))).toBe(true);
    }
  );

  it.each(['warning', 'error', 'fatal'])('accepts the %s severity', async (severity) => {
    const { default: guard } = await loadGuard();

    expect(guard.is(buildRecoverable({ severity }))).toBe(true);
  });

  it('accepts a non-recoverable error whose strategy is none', async () => {
    const { default: guard } = await loadGuard();

    expect(guard.is(buildRecoverable({ recoverable: false, strategy: 'none' }))).toBe(true);
  });

  it('accepts a cause of any shape and its absence alike', async () => {
    const { default: guard } = await loadGuard();

    expect(guard.is(buildRecoverable({ cause: buildToken() }))).toBe(true);
    expect(guard.is(buildRecoverable({ cause: undefined }))).toBe(true);
  });

  it('narrows the value so its fields can be read without a cast', async () => {
    const { default: guard } = await loadGuard();
    const value: unknown = buildRecoverable({ strategy: 'reload' });

    const strategy = guard.is(value) ? value.strategy : undefined;

    expect(strategy).toBe('reload');
  });

  it.each([undefined, null, 'retry', 42, true])(
    'rejects the non-object value %p',
    async (value) => {
      const { default: guard } = await loadGuard();

      expect(guard.is(value)).toBe(false);
    }
  );

  it('rejects an empty object', async () => {
    const { default: guard } = await loadGuard();

    expect(guard.is({})).toBe(false);
  });

  it.each([undefined, 'yes', 1])('rejects a recoverable flag of %p', async (recoverable) => {
    const { default: guard } = await loadGuard();

    expect(guard.is(buildRecoverable({ recoverable }))).toBe(false);
  });

  it.each([undefined, 'restart', '', 'RETRY', ['retry']])(
    'rejects a strategy of %p',
    async (strategy) => {
      const { default: guard } = await loadGuard();

      expect(guard.is(buildRecoverable({ strategy }))).toBe(false);
    }
  );

  it.each([undefined, 'info', '', 'ERROR', ['error']])(
    'rejects a severity of %p',
    async (severity) => {
      const { default: guard } = await loadGuard();

      expect(guard.is(buildRecoverable({ severity }))).toBe(false);
    }
  );

  it.each([undefined, '', 42, ['error_boundary.retryable']])(
    'rejects a messageKey of %p',
    async (messageKey) => {
      const { default: guard } = await loadGuard();

      expect(guard.is(buildRecoverable({ messageKey }))).toBe(false);
    }
  );

  it('accepts a fully typed RecoverableError', async () => {
    const { default: guard } = await loadGuard();
    const error: RecoverableError = {
      recoverable: true,
      strategy: 'navigate-home',
      messageKey: 'error_boundary.route',
      severity: 'warning',
    };

    expect(guard.is(error)).toBe(true);
  });
});
