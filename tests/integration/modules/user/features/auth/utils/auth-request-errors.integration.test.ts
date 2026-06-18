import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';

const authErrorHandler = container.resolve<AuthErrorHandler>(TOKENS.AuthErrorHandler);
const authRequestErrors = new AuthRequestErrors(authErrorHandler);

describe('auth request errors integration coverage', () => {
  it('detects AbortError-like objects by name', () => {
    expect(authRequestErrors.isAbortError({ name: 'AbortError' })).toBe(true);
    expect(authRequestErrors.isAbortError(new Error('not aborted'))).toBe(false);
  });

  it('recognizes UiError-shaped objects and rejects invalid values', () => {
    expect(
      authRequestErrors.isUiError({ displayMessage: 'Registration failed', retryable: true })
    ).toBe(true);
    expect(authRequestErrors.isUiError(null)).toBe(false);
    expect(authRequestErrors.isUiError('not-an-object')).toBe(false);
    expect(authRequestErrors.isUiError({ displayMessage: 'Missing retryable flag' })).toBe(false);
  });

  it('returns existing UiErrors unchanged', () => {
    const uiError = {
      displayMessage: 'Use the existing message',
      retryable: false,
    };

    expect(authRequestErrors.toUiError(uiError)).toBe(uiError);
  });

  it('delegates non-UiErrors through the shared AuthErrorHandler pipeline', () => {
    const originalError = new Error('boom');

    expect(authRequestErrors.toUiError(originalError)).toEqual(
      authErrorHandler.handle(originalError)
    );
  });

  it('creates joined validation errors', () => {
    expect(
      authRequestErrors.createValidationUiError(['email invalid', 'password weak'], false, '\n')
    ).toEqual({
      displayMessage: 'email invalid\npassword weak',
      retryable: false,
    });
  });

  it('maps parsed auth errors through the shared error pipeline', () => {
    expect(authErrorHandler.handle(new Error('boom'))).toEqual(
      expect.objectContaining({
        displayMessage: expect.any(String),
        retryable: expect.any(Boolean),
      })
    );
  });
});
