/**
 * Stryker's enriched node environment, not bare `node`: the plain one reports no coverage back to
 * the mutation runner and fails its dry run. jsdom 26 exposes `window` as a non-configurable
 * accessor, so the no-window default can only be reached from an environment that never declares
 * it.
 *
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import AuthStateVar from '@auth/stores/auth-var';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';

describe('auth-var seed token without a window global', () => {
  const originalEnv = process.env[ENV_KEY];

  afterEach(() => {
    if (originalEnv === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnv;
  });

  it('uses the env token by default when window is absent, else null', () => {
    process.env[ENV_KEY] = 'env-token';
    expect(AuthStateVar.readSeedToken()).toBe('env-token');

    delete process.env[ENV_KEY];
    expect(AuthStateVar.readSeedToken()).toBeNull();
  });
});
