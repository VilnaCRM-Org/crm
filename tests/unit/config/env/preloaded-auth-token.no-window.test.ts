/**
 * jsdom 26 exposes `window` as a non-configurable accessor, so the ambient-window fallback can
 * only be reached from an environment that never declares one. Stryker's enriched node
 * environment, not bare `node`: the plain one reports no coverage back to the mutation runner
 * and fails its dry run.
 *
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import preloadedAuthTokenSeed from '@/config/env/preloaded-auth-token';
import { buildToken } from '@tests/builders';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';

describe('preloadedAuthTokenSeed without a window global', () => {
  const originalEnv = process.env[ENV_KEY];

  afterEach(() => {
    if (originalEnv === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnv;
  });

  it('runs in an environment where no window global is declared', () => {
    expect(typeof globalThis.window).toBe('undefined');
  });

  it('uses the env token when there is no window at all', () => {
    const envToken = buildToken();
    process.env[ENV_KEY] = envToken;

    expect(preloadedAuthTokenSeed.read()).toBe(envToken);
  });

  it('returns null when there is no window and no env token', () => {
    delete process.env[ENV_KEY];

    expect(preloadedAuthTokenSeed.read()).toBeNull();
  });
});
