import { AuthStateVar, authActions } from '@auth/stores';

describe('auth stores composition root', () => {
  afterEach(() => AuthStateVar.reset());

  it('exposes action wrappers that delegate to the resolved AuthStoreActions', async () => {
    await authActions.loginUser({ email: 'a@b.c', password: 'p' });
    await authActions.registerUser({ fullName: 'A', email: 'a@b.c', password: 'p' });
    authActions.resetRegistration();
    authActions.clearLoginError();
    authActions.logout();
    authActions.reset();

    expect(AuthStateVar.get()).toMatchObject({ token: null, user: null, loginError: null });
  });
});
