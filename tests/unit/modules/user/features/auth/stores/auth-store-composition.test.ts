import observabilityCore from '@/services/observability/observability-core';
import { AuthStateVar, authActions } from '@auth/stores';

describe('auth stores composition root', () => {
  let clearSpy: jest.SpyInstance;

  beforeEach(() => {
    clearSpy = jest.spyOn(observabilityCore, 'clearUser').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    AuthStateVar.reset();
  });

  it('clears the observability identity on logout', () => {
    authActions.logout();

    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

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
