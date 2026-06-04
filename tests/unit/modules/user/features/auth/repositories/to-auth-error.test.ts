import { uiErrorToAuthError, validationIssuesToAuthError } from '@auth/repositories/to-auth-error';

describe('to-auth-error', () => {
  it('maps a UiError to an unknown-kind AuthError', () => {
    const result = uiErrorToAuthError({ displayMessage: 'Boom', retryable: true });
    expect(result).toEqual({ kind: 'unknown', displayMessage: 'Boom', retryable: true });
  });

  it('builds a validation AuthError that preserves issues', () => {
    const result = validationIssuesToAuthError('Invalid data provided', [
      { path: 'email', message: 'Invalid email' },
    ]);
    expect(result.kind).toBe('validation');
    expect(result.retryable).toBe(false);
    expect(result.issues).toEqual([{ path: 'email', message: 'Invalid email' }]);
  });
});
