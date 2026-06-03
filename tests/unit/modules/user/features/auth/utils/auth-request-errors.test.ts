import {
  createValidationUiError,
  isAbortError,
  isUiError,
  toUiError,
} from '@/modules/user/features/auth/utils/auth-request-errors';
import { handleAuthError } from '@/modules/user/features/auth/utils/handle-auth-error';

jest.mock('@/modules/user/features/auth/utils/handle-auth-error', () => ({
  __esModule: true,
  handleAuthError: jest.fn(),
}));

const mockedHandleAuthError = handleAuthError as jest.MockedFunction<typeof handleAuthError>;

describe('auth-request-errors', () => {
  beforeEach(() => {
    mockedHandleAuthError.mockReset();
  });

  it('detects AbortError-like objects by name only', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
    expect(isAbortError(new Error('not aborted'))).toBe(false);
  });

  it('recognizes UiError-shaped objects and rejects invalid values', () => {
    expect(
      isUiError({
        displayMessage: 'Registration failed',
        retryable: true,
      })
    ).toBe(true);
    expect(isUiError(null)).toBe(false);
    expect(isUiError('not-an-object')).toBe(false);
    expect(isUiError({ displayMessage: 'Missing retryable flag' })).toBe(false);
  });

  it('returns the same UiError without delegating', () => {
    const uiError = {
      displayMessage: 'Use the existing message',
      retryable: false,
    };

    expect(toUiError(uiError)).toBe(uiError);
    expect(mockedHandleAuthError).not.toHaveBeenCalled();
  });

  it('delegates non-UiError values to handleAuthError', () => {
    const fallbackUiError = {
      displayMessage: 'Fallback',
      retryable: true,
    };
    const originalError = new Error('boom');
    mockedHandleAuthError.mockReturnValue(fallbackUiError);

    expect(toUiError(originalError)).toBe(fallbackUiError);
    expect(mockedHandleAuthError).toHaveBeenCalledWith(originalError);
  });

  it('creates joined validation errors', () => {
    expect(createValidationUiError(['email invalid', 'password weak'], false, '\n')).toEqual({
      displayMessage: 'email invalid\npassword weak',
      retryable: false,
    });
  });
});
