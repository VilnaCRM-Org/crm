import { isAuthError, type AuthError } from '@auth/types/auth-error';

describe('auth-error', () => {
  it('narrows a structured AuthError via isAuthError', () => {
    const error: AuthError = {
      kind: 'validation',
      displayMessage: 'Invalid data provided',
      retryable: false,
      issues: [{ path: 'email', message: 'Invalid email' }],
    };
    expect(isAuthError(error)).toBe(true);
    expect(isAuthError({ displayMessage: 'x' })).toBe(false);
    expect(isAuthError(null)).toBe(false);
  });
});
