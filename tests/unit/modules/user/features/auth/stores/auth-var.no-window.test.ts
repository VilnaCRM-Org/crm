/**
 * @jest-environment node
 */
import type { AuthStateVar } from '@auth/stores/auth-var';
import { buildToken } from '@tests/builders';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const SEED_TOKEN = buildToken();

const loadFresh = async (): Promise<AuthStateVar> => {
  let instance: AuthStateVar | undefined;
  await jest.isolateModulesAsync(async () => {
    instance = (await import('@auth/stores/auth-var')).default;
  });
  return instance as AuthStateVar;
};

describe('auth-var seed token without a window global', () => {
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

    expect(fresh.get().token).toBe(SEED_TOKEN);
    expect(fresh.readSeedToken()).toBe(SEED_TOKEN);
  });

  it('reads no token when window is not declared and no env token is set', async () => {
    delete process.env[ENV_KEY];

    const fresh = await loadFresh();

    expect(fresh.get().token).toBeNull();
    expect(fresh.readSeedToken()).toBeNull();
  });
});
