import type AuthErrorHandler from '@/modules/user/features/auth/utils/auth-error-handler';
import AuthRequestErrors from '@/modules/user/features/auth/utils/auth-request-errors';

const mockHandle = jest.fn();
const authErrorHandler = { handle: mockHandle } as unknown as AuthErrorHandler;
const authRequestErrors = new AuthRequestErrors(authErrorHandler);

describe('AuthRequestErrors', () => {
  beforeEach(() => {
    mockHandle.mockReset();
  });

  it('detects AbortError-like objects by name only', () => {
    expect(authRequestErrors.isAbortError({ name: 'AbortError' })).toBe(true);
    expect(authRequestErrors.isAbortError(new Error('not aborted'))).toBe(false);
  });

  it('recognizes UiError-shaped objects and rejects invalid values', () => {
    expect(
      authRequestErrors.isUiError({
        displayMessage: 'Registration failed',
        retryable: true,
      })
    ).toBe(true);
    expect(authRequestErrors.isUiError(null)).toBe(false);
    expect(authRequestErrors.isUiError('not-an-object')).toBe(false);
    expect(authRequestErrors.isUiError({ displayMessage: 'Missing retryable flag' })).toBe(false);
  });

  it('returns the same UiError without delegating', () => {
    const uiError = {
      displayMessage: 'Use the existing message',
      retryable: false,
    };

    expect(authRequestErrors.toUiError(uiError)).toBe(uiError);
    expect(mockHandle).not.toHaveBeenCalled();
  });

  it('delegates non-UiError values to the injected AuthErrorHandler', () => {
    const fallbackUiError = {
      displayMessage: 'Fallback',
      retryable: true,
    };
    const originalError = new Error('boom');
    mockHandle.mockReturnValue(fallbackUiError);

    expect(authRequestErrors.toUiError(originalError)).toBe(fallbackUiError);
    expect(mockHandle).toHaveBeenCalledWith(originalError);
  });

  it('creates joined validation errors', () => {
    expect(
      authRequestErrors.createValidationUiError(['email invalid', 'password weak'], false, '\n')
    ).toEqual({
      displayMessage: 'email invalid\npassword weak',
      retryable: false,
    });
  });
});
