import { act, renderHook } from '@testing-library/react';

import authStoreSelectors from '@auth/stores/auth-store-selectors';
import useAuthState from '@auth/stores/use-auth-state';
import type useAuthStoreHook from '@auth/stores/use-auth-store';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthState } from '@auth/types/auth-store';
import { buildEmail, buildFullName, buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';
import { PRELOADED_AUTH_TOKEN_WINDOW_KEY } from '@tests/utils/seed-preloaded-auth-token';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const OPT_IN_KEY = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';

const CLEARED: AuthState = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

type AuthStoreModule = {
  default: typeof useAuthStoreHook;
  CLEARED_AUTH_STATE: AuthState;
};

const loadFresh = (): Promise<AuthStoreModule> =>
  loadIsolated(() => import('@auth/stores/use-auth-store'));

describe('useAuthStore', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetClientStores();
    process.env = { ...originalEnv };
    delete process.env[ENV_KEY];
    delete process.env[OPT_IN_KEY];
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  afterEach(() => {
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    delete window[PRELOADED_AUTH_TOKEN_WINDOW_KEY];
  });

  it('exports the cleared state as the baseline every field falls back to', () => {
    expect(CLEARED_AUTH_STATE).toEqual(CLEARED);
  });

  it('starts from the fully cleared state', async () => {
    const fresh = await loadFresh();

    expect(fresh.default.getState()).toEqual(CLEARED);
  });

  it('merges partial writes and returns to the cleared state when it is written back', () => {
    const email = buildEmail();
    const token = buildToken();
    useAuthStore.setState({
      email,
      token,
      user: { email, fullName: buildFullName() },
      loginLoading: true,
      loginError: { kind: 'server', displayMessage: 'Down', retryable: true },
      registerLoading: true,
      registerError: { kind: 'conflict', displayMessage: 'Taken', retryable: false },
    });
    expect(useAuthStore.getState()).toMatchObject({ email, token, loginLoading: true });

    useAuthStore.setState(CLEARED_AUTH_STATE);

    expect(useAuthStore.getState()).toEqual(CLEARED);
  });

  it('re-renders a useAuthState consumer when the store changes', () => {
    const email = buildEmail();
    const { result } = renderHook(() => useAuthState());
    expect(result.current.email).toBe('');

    act(() => useAuthStore.setState({ email }));

    expect(result.current.email).toBe(email);
  });

  it('seeds only the token from the window when the module loads', async () => {
    const token = buildToken();
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = ` ${token} `;

    const fresh = await loadFresh();

    expect(fresh.default.getState()).toEqual({ ...CLEARED, token });
  });

  it('stays unauthenticated in a production build even when both sources are preset', async () => {
    process.env.NODE_ENV = 'production';
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = buildToken();
    process.env[ENV_KEY] = buildToken();

    const state = (await loadFresh()).default.getState();

    expect(state.token).toBeNull();
    expect(authStoreSelectors.isAuthenticated(state)).toBe(false);
  });

  it('still seeds a production build that opted in, as the test image does', async () => {
    const token = buildToken();
    process.env.NODE_ENV = 'production';
    process.env[OPT_IN_KEY] = 'true';
    process.env[ENV_KEY] = token;

    const state = (await loadFresh()).default.getState();

    expect(state.token).toBe(token);
    expect(authStoreSelectors.isAuthenticated(state)).toBe(true);
  });

  it('restores the initial state through the reset helper', () => {
    useAuthStore.setState({ email: buildEmail(), loginLoading: true });

    resetClientStores();

    expect(useAuthStore.getState()).toEqual(CLEARED);
  });
});
