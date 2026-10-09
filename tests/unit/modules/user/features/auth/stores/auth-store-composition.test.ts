import observabilityCore from '@/services/observability/observability-core';
import { useAuthStore, authActions } from '@auth/stores';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('auth stores composition root', () => {
  let clearSpy: jest.SpyInstance;

  beforeEach(() => {
    clearSpy = jest.spyOn(observabilityCore, 'clearUser').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    resetClientStores();
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

    expect(useAuthStore.getState()).toMatchObject({ token: null, user: null, loginError: null });
  });
});
