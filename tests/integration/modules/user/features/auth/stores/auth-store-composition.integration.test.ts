import '../../../../../setup';

import { renderHook } from '@testing-library/react';

import { AuthStateVar, authActions, useAuthState, useAuthToken } from '@auth/stores';
import { buildCredentials, buildUser } from '@tests/builders';

import server, { defaultLoginResponse } from '../../../../../mocks/server';

describe('auth stores composition root integration', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    AuthStateVar.reset();
  });
  afterAll(() => server.close());

  it('drives login and registration through the real repository and clears state', async () => {
    await authActions.loginUser(buildCredentials());
    expect(AuthStateVar.get().token).toBe(defaultLoginResponse.token);

    await authActions.registerUser(buildUser());
    expect(AuthStateVar.get().registerError).toBeNull();

    authActions.resetRegistration();
    authActions.clearLoginError();
    authActions.logout();
    authActions.reset();

    expect(AuthStateVar.get()).toMatchObject({
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
