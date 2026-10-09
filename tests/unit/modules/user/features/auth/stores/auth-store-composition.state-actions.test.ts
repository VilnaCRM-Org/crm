import type useAuthStoreHook from '@auth/stores/use-auth-store';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthActions } from '@auth/types/auth-store';
import { buildEmail, buildFullName, buildToken } from '@tests/builders';

interface Barrel {
  authActions: AuthActions;
  useAuthStore: typeof useAuthStoreHook;
}

const email = buildEmail();
const fullName = buildFullName();
const token = buildToken();

const CLEARED = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

const loginError: AuthError = { kind: 'authentication', displayMessage: 'No', retryable: false };
const registerError: AuthError = { kind: 'conflict', displayMessage: 'Taken', retryable: false };

const POPULATED = {
  email,
  token,
  user: { email, fullName },
  loginLoading: true,
  loginError,
  registerLoading: true,
  registerError,
};

const loadPopulatedBarrel = async (): Promise<Barrel> => {
  let barrel: Barrel | undefined;
  await jest.isolateModulesAsync(async () => {
    barrel = (await import('@auth/stores')) as unknown as Barrel;
  });
  const loaded = barrel as Barrel;
  loaded.useAuthStore.setState(POPULATED);
  return loaded;
};

describe('auth stores composition root state actions', () => {
  it('clears every state field on reset', async () => {
    const { authActions, useAuthStore } = await loadPopulatedBarrel();

    authActions.reset();

    expect(useAuthStore.getState()).toEqual(CLEARED);
  });

  it('clears only the registration fields on resetRegistration', async () => {
    const { authActions, useAuthStore } = await loadPopulatedBarrel();

    authActions.resetRegistration();

    expect(useAuthStore.getState()).toEqual({
      ...POPULATED,
      user: null,
      registerLoading: false,
      registerError: null,
    });
  });

  it('clears only the login error on clearLoginError', async () => {
    const { authActions, useAuthStore } = await loadPopulatedBarrel();

    authActions.clearLoginError();

    expect(useAuthStore.getState()).toEqual({ ...POPULATED, loginError: null });
  });
});
