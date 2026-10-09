import '../../../../../setup';

import { act, renderHook } from '@testing-library/react';

import { useAuthStore, authActions, useAuthState, useAuthToken } from '@auth/stores';
import { buildCredentials, buildUser } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

import server, { defaultLoginResponse } from '../../../../../mocks/server';

describe('auth stores composition root integration', () => {
  afterEach(() => {
    server.resetHandlers();
    act(() => {
      resetClientStores();
    });
  });

  it('drives login and registration through the real repository and clears state', async () => {
    await authActions.loginUser(buildCredentials());
    expect(useAuthStore.getState().token).toBe(defaultLoginResponse.token);

    await authActions.registerUser(buildUser());
    expect(useAuthStore.getState().registerError).toBeNull();

    authActions.resetRegistration();
    authActions.clearLoginError();
    authActions.logout();
    authActions.reset();

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      user: null,
      loginError: null,
      registerError: null,
    });
  });

  it('exposes the reactive auth-state hook through the composition root', () => {
    const { result } = renderHook(() => useAuthState());
    expect(result.current.token).toBeNull();
  });

  it('exposes the token slice hook through the composition root', () => {
    const { result } = renderHook(() => useAuthToken());
    expect(result.current).toBeNull();
  });
});
