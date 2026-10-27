import AuthStoreSelectors from '@auth/stores/auth-store-selectors';
import type { AuthState } from '@auth/types/auth-store';

const base: AuthState = {
  email: 'a@b.c',
  token: 't',
  user: { email: 'a@b.c' },
  loginLoading: true,
  loginError: { kind: 'unknown', displayMessage: 'x', retryable: true },
  registerLoading: false,
  registerError: { kind: 'conflict', displayMessage: 'y', retryable: false },
  twoFactorStatus: 'unknown',
  pendingSessionId: null,
  recoveryCodesRemaining: null,
};

describe('AuthStoreSelectors', () => {
  it('keeps its nine public methods and gains none for the two-factor status', () => {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(AuthStoreSelectors)).filter(
      (name) => name !== 'constructor'
    );

    expect(methods.sort()).toEqual([
      'email',
      'isAuthenticated',
      'loginError',
      'loginLoading',
      'registerError',
      'registerLoading',
      'registerRetryable',
      'registerUser',
      'token',
    ]);
  });

  it('reads scalar state', () => {
    expect(AuthStoreSelectors.email(base)).toBe('a@b.c');
    expect(AuthStoreSelectors.token(base)).toBe('t');
    expect(AuthStoreSelectors.isAuthenticated(base)).toBe(true);
    expect(AuthStoreSelectors.loginLoading(base)).toBe(true);
    expect(AuthStoreSelectors.registerLoading(base)).toBe(false);
  });

  it('reads structured errors, user, and derived retryable', () => {
    expect(AuthStoreSelectors.loginError(base)?.displayMessage).toBe('x');
    expect(AuthStoreSelectors.registerError(base)?.kind).toBe('conflict');
    expect(AuthStoreSelectors.registerUser(base)).toEqual({ email: 'a@b.c' });
    expect(AuthStoreSelectors.registerRetryable(base)).toBe(false);
  });

  it('handles null token and null register error', () => {
    const state: AuthState = { ...base, token: null, registerError: null };
    expect(AuthStoreSelectors.isAuthenticated(state)).toBe(false);
    expect(AuthStoreSelectors.registerError(state)).toBeNull();
    expect(AuthStoreSelectors.registerRetryable(state)).toBeUndefined();
  });
});
