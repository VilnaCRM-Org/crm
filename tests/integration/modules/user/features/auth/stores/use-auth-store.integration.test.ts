import '../../../../../setup';

import { act, renderHook } from '@testing-library/react';

import authStoreSelectors from '@auth/stores/auth-store-selectors';
import useAuthState from '@auth/stores/use-auth-state';
import type useAuthStoreHook from '@auth/stores/use-auth-store';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';
import { resetClientStores } from '@tests/utils/reset-client-stores';
import { PRELOADED_AUTH_TOKEN_WINDOW_KEY } from '@tests/utils/seed-preloaded-auth-token';

const ENV_KEY = 'REACT_APP_LHCI_PRELOADED_AUTH_TOKEN';
const OPT_IN_KEY = 'ENABLE_PRELOADED_AUTH_TOKEN_SEED';

const loadFresh = (): Promise<typeof useAuthStoreHook> =>
  loadIsolated(async () => (await import('@auth/stores/use-auth-store')).default);

describe('useAuthStore integration coverage', () => {
  beforeEach(() => resetClientStores());

  it('merges updates, exposes a cleared baseline, and resets', () => {
    const token = buildToken();
    useAuthStore.setState({ email: 'a@b.c', token });
    expect(useAuthStore.getState()).toMatchObject({ email: 'a@b.c', token });

    useAuthStore.setState(CLEARED_AUTH_STATE);

    expect(useAuthStore.getState()).toEqual(CLEARED_AUTH_STATE);
  });

  it('re-renders consumers of useAuthState on change', () => {
    const token = buildToken();
    const { result } = renderHook(() => useAuthState());
    expect(result.current.token).toBeNull();

    act(() => useAuthStore.setState({ token }));

    expect(result.current.token).toBe(token);
  });
});

describe('preloaded auth token seed integration coverage', () => {
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
  });

  it('seeds the loaded store from the window token, trimmed', async () => {
    const token = buildToken();
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = ` ${token} `;

    expect((await loadFresh()).getState().token).toBe(token);
  });

  it('leaves a production build unauthenticated even when both sources are preset', async () => {
    process.env.NODE_ENV = 'production';
    window[PRELOADED_AUTH_TOKEN_WINDOW_KEY] = buildToken();
    process.env[ENV_KEY] = buildToken();

    const state = (await loadFresh()).getState();

    expect(state.token).toBeNull();
    expect(authStoreSelectors.isAuthenticated(state)).toBe(false);
  });

  it('still seeds a production build that opted in, as the test image does', async () => {
    const token = buildToken();
    process.env.NODE_ENV = 'production';
    process.env[OPT_IN_KEY] = 'true';
    process.env[ENV_KEY] = token;

    const state = (await loadFresh()).getState();

    expect(state.token).toBe(token);
    expect(authStoreSelectors.isAuthenticated(state)).toBe(true);
  });
});
