import {
  createValidationUiError,
  isAbortError,
  isUiError,
  toUiError,
} from '@/modules/user/features/auth/utils/auth-request-errors';
import { handleAuthError } from '@/modules/user/features/auth/utils/handle-auth-error';

describe('auth request errors integration coverage', () => {
  it('detects AbortError-like objects by name', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
    expect(isAbortError(new Error('not aborted'))).toBe(false);
  });

  it('recognizes UiError-shaped objects and rejects invalid values', () => {
    expect(isUiError({ displayMessage: 'Registration failed', retryable: true })).toBe(true);
    expect(isUiError(null)).toBe(false);
    expect(isUiError('not-an-object')).toBe(false);
    expect(isUiError({ displayMessage: 'Missing retryable flag' })).toBe(false);
  });

  it('returns existing UiErrors unchanged', () => {
    const uiError = {
      displayMessage: 'Use the existing message',
      retryable: false,
    };

    expect(toUiError(uiError)).toBe(uiError);
  });

  it('delegates non-UiErrors to handleAuthError', () => {
    const originalError = new Error('boom');

    expect(toUiError(originalError)).toEqual(handleAuthError(originalError));
  });

  it('creates joined validation errors', () => {
    expect(createValidationUiError(['email invalid', 'password weak'], false, '\n')).toEqual({
      displayMessage: 'email invalid\npassword weak',
      retryable: false,
    });
  });

  it('maps parsed auth errors through the shared error pipeline', () => {
    expect(handleAuthError(new Error('boom'))).toEqual(
      expect.objectContaining({
        displayMessage: expect.any(String),
        retryable: expect.any(Boolean),
      })
    );
  });
});
