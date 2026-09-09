import '../../../../../setup';

import { act, renderHook } from '@testing-library/react';

import preloadedAuthTokenSeed from '@/config/env/preloaded-auth-token';
import authStoreSelectors from '@auth/stores/auth-store-selectors';
import authStateVar, { AuthStateVar } from '@auth/stores/auth-var';
import useAuthState from '@auth/stores/use-auth-state';
import { buildToken } from '@tests/builders';
import { PRELOADED_AUTH_TOKEN_WINDOW_KEY } from '@tests/utils/seed-preloaded-auth-token';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const OPT_IN_KEY = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';
const CLEARED = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

describe('auth-var integration coverage', () => {
  beforeEach(() => authStateVar.reset());

  it('merges updates, exposes a cleared baseline, and resets', () => {
    const token = buildToken();
    authStateVar.set({ email: 'a@b.c', token });
    expect(authStateVar.get()).toMatchObject({ email: 'a@b.c', token });
    authStateVar.reset();
    expect(authStateVar.get()).toEqual(CLEARED);
  });

  it('re-renders consumers of useAuthState on change', () => {
    const token = buildToken();
    const { result } = renderHook(() => useAuthState());
    expect(result.current.token).toBeNull();
    act(() => authStateVar.set({ token }));
    expect(result.current.token).toBe(token);
  });
});

describe('preloaded auth token seed integration coverage', () => {
  const originalWindow = global.window;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[ENV_KEY];
    delete process.env[OPT_IN_KEY];
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  afterEach(() => {
    Object.defineProperty(global, 'window', { configurable: true, value: originalWindow });
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  it('prefers a window token over the env token and trims both', () => {
    const windowToken = buildToken();
    process.env[ENV_KEY] = buildToken();

    expect(
      preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: ` ${windowToken} ` })
    ).toBe(windowToken);
  });

  it('falls back to the env token, then to null', () => {
    const envToken = buildToken();
    process.env[ENV_KEY] = ` ${envToken} `;
    expect(preloadedAuthTokenSeed.read({})).toBe(envToken);

    delete process.env[ENV_KEY];
    expect(preloadedAuthTokenSeed.read({})).toBeNull();
  });

  it('reads the ambient window when no window is passed', () => {
    const token = buildToken();
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = token;

    expect(preloadedAuthTokenSeed.read()).toBe(token);
  });

  it('uses the env token when window is absent, else null', () => {
    const envToken = buildToken();
    Object.defineProperty(global, 'window', { configurable: true, value: undefined });

    process.env[ENV_KEY] = envToken;
    expect(preloadedAuthTokenSeed.read()).toBe(envToken);

    delete process.env[ENV_KEY];
    expect(preloadedAuthTokenSeed.read()).toBeNull();
  });

  it('ignores blank tokens from both sources', () => {
    process.env[ENV_KEY] = '   ';

    expect(preloadedAuthTokenSeed.read({ [PRELOADED_AUTH_TOKEN_WINDOW_KEY]: '   ' })).toBeNull();
  });

  it('leaves a production build unauthenticated even when both sources are preset', () => {
    process.env.NODE_ENV = 'production';
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = buildToken();
    process.env[ENV_KEY] = buildToken();

    const state = new AuthStateVar().get();

    expect(state.token).toBeNull();
    expect(authStoreSelectors.isAuthenticated(state)).toBe(false);
  });

  it('still seeds a production build that explicitly opted in, as the test image does', () => {
    const token = buildToken();
    process.env.NODE_ENV = 'production';
    process.env[OPT_IN_KEY] = 'true';
    process.env[ENV_KEY] = token;

    const state = new AuthStateVar().get();

    expect(state.token).toBe(token);
    expect(authStoreSelectors.isAuthenticated(state)).toBe(true);
  });
});
