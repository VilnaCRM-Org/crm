/**
 * Stryker's enriched node environment, not bare `node`: the plain one reports no coverage back to
 * the mutation runner and fails its dry run.
 *
 * @jest-environment @stryker-mutator/jest-runner/jest-env/node
 */
import type useAuthStore from '@auth/stores/use-auth-store';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const SEED_TOKEN = buildToken();

const loadFresh = (): Promise<typeof useAuthStore> =>
  loadIsolated(async () => (await import('@auth/stores/use-auth-store')).default);

describe('useAuthStore seed token without a window global', () => {
  const originalEnvToken = process.env[ENV_KEY];

  afterEach(() => {
    if (originalEnvToken === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnvToken;
  });

  it('runs in an environment where no window global is declared', () => {
    expect(typeof globalThis.window).toBe('undefined');
  });

  it('falls back to the env seed token when window is not declared', async () => {
    process.env[ENV_KEY] = SEED_TOKEN;

    const fresh = await loadFresh();

    expect(fresh.getState().token).toBe(SEED_TOKEN);
  });

  it('reads no token when window is not declared and no env token is set', async () => {
    delete process.env[ENV_KEY];

    const fresh = await loadFresh();

    expect(fresh.getState().token).toBeNull();
  });
});
