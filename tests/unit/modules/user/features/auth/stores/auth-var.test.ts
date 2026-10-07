import { act, renderHook } from '@testing-library/react';

import authStoreSelectors from '@auth/stores/auth-store-selectors';
import authStateVar, { AuthStateVar } from '@auth/stores/auth-var';
import useAuthState from '@auth/stores/use-auth-state';
import { buildEmail, buildToken } from '@tests/builders';
import { PRELOADED_AUTH_TOKEN_WINDOW_KEY } from '@tests/utils/seed-preloaded-auth-token';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const OPT_IN_KEY = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';
const DEMO_STORAGE_KEY = 'vilnacrm.sandbox-demo-session';
const DEMO_EMAIL = 'demo@vilnacrm.com';
const CLEARED = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

describe('auth-var state helpers', () => {
  beforeEach(() => authStateVar.reset());

  it('starts from a fully cleared state', () => {
    expect(authStateVar.get()).toEqual(CLEARED);
  });

  it('merges partial updates and resets back to cleared state', () => {
    const token = buildToken();
    authStateVar.set({ email: 'a@b.c', token, loginLoading: true });
    expect(authStateVar.get()).toMatchObject({ email: 'a@b.c', token, loginLoading: true });

    authStateVar.reset();
    expect(authStateVar.get().token).toBeNull();
  });

  it('re-renders consumers of useAuthState when the reactive var changes', () => {
    const email = buildEmail();
    const { result } = renderHook(() => useAuthState());
    expect(result.current.email).toBe('');

    act(() => authStateVar.set({ email }));
    expect(result.current.email).toBe(email);
  });
});

describe('initial seeded token', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[ENV_KEY];
    delete process.env[OPT_IN_KEY];
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  afterEach(() => {
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
    localStorage.removeItem(DEMO_STORAGE_KEY);
  });

  it('starts fully cleared when nothing seeds or restores a session', () => {
    expect(new AuthStateVar().get()).toEqual(CLEARED);
  });

  it('restores a remembered sandbox demo session ahead of the preloaded seed', () => {
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = buildToken();
    localStorage.setItem(DEMO_STORAGE_KEY, DEMO_EMAIL);

    expect(new AuthStateVar().get()).toEqual({
      ...CLEARED,
      email: DEMO_EMAIL,
      token: 'sandbox-demo-session-token',
    });
  });

  it('restores no demo session in a production build served off a sandbox host', () => {
    process.env.NODE_ENV = 'production';
    localStorage.setItem(DEMO_STORAGE_KEY, DEMO_EMAIL);

    expect(new AuthStateVar().get()).toEqual(CLEARED);
  });

  it('seeds from the preloaded sources outside a production build', () => {
    const token = buildToken();
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = token;

    expect(new AuthStateVar().get().token).toBe(token);
  });

  it('stays unauthenticated in a production build even when both sources are preset', () => {
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
