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
};

describe('AuthStoreSelectors', () => {
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
