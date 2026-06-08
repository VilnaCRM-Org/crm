import '../../../../../setup';

import { renderHook } from '@testing-library/react';

import { AuthStateVar, authActions, useAuthState } from '@auth/stores';

import server from '../../../../../mocks/server';

describe('auth stores composition root integration', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    AuthStateVar.reset();
  });
  afterAll(() => server.close());

  it('drives login and registration through the real repository and clears state', async () => {
    await authActions.loginUser({ email: 'a@b.c', password: 'password' });
    expect(AuthStateVar.get().token).toBe('default-token-123');

    await authActions.registerUser({ fullName: 'A B', email: 'a@b.c', password: 'password' });
    expect(AuthStateVar.get().registerError).toBeNull();

    authActions.resetRegistration();
    authActions.clearLoginError();
    authActions.logout();
    authActions.reset();

    expect(AuthStateVar.get()).toMatchObject({ token: null, user: null, loginError: null });
  });

  it('exposes the reactive auth-state hook through the composition root', () => {
    const { result } = renderHook(() => useAuthState());
    expect(result.current.token).toBeNull();
  });
});
