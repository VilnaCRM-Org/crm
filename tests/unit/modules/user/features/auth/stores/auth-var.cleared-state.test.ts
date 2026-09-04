import type { AuthStateVar } from '@auth/stores/auth-var';
import type { AuthState } from '@auth/types/auth-store';
import { buildEmail, buildFullName, buildToken } from '@tests/builders';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__';

const CLEARED: AuthState = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

const email = buildEmail();
const fullName = buildFullName();
const token = buildToken();

const loadFresh = async (): Promise<AuthStateVar> => {
  let instance: AuthStateVar | undefined;
  await jest.isolateModulesAsync(async () => {
    instance = (await import('@auth/stores/auth-var')).default;
  });
  return instance as AuthStateVar;
};

describe('auth-var cleared state', () => {
  const originalEnvToken = process.env[ENV_KEY];
  const originalWindowToken = window.__PRELOADED_AUTH_TOKEN__;

  beforeEach(() => {
    delete process.env[ENV_KEY];
    delete window.__PRELOADED_AUTH_TOKEN__;
  });

  afterEach(() => {
    if (originalEnvToken === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = originalEnvToken;
    if (originalWindowToken === undefined) delete window.__PRELOADED_AUTH_TOKEN__;
    else window.__PRELOADED_AUTH_TOKEN__ = originalWindowToken;
  });

  it('constructs a freshly loaded module in the fully cleared state', async () => {
    const fresh = await loadFresh();

    expect(fresh.get()).toEqual(CLEARED);
  });

  it('returns to the cleared state after every field has been populated', async () => {
    const fresh = await loadFresh();
    fresh.set({
      email,
      token,
      user: { email, fullName },
      loginLoading: true,
      loginError: { kind: 'server', displayMessage: 'Down', retryable: true },
      registerLoading: true,
      registerError: { kind: 'conflict', displayMessage: 'Taken', retryable: false },
    });

    fresh.reset();

    expect(fresh.get()).toEqual(CLEARED);
  });

  it('seeds only the token when a preloaded token is present at construction', async () => {
    window[WINDOW_KEY] = token;

    const fresh = await loadFresh();

    expect(fresh.get()).toEqual({ ...CLEARED, token });
  });
});
