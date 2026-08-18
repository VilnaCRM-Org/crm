import type AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';

const handle = jest.fn();
const authRequestErrors = new AuthRequestErrors({ handle } as unknown as AuthErrorHandler);

describe('AuthRequestErrors — narrowing guards', () => {
  it('reports non-object values as non-abort errors instead of throwing', () => {
    expect(authRequestErrors.isAbortError('AbortError')).toBe(false);
    expect(authRequestErrors.isAbortError(42)).toBe(false);
    expect(authRequestErrors.isAbortError(undefined)).toBe(false);
    expect(authRequestErrors.isAbortError(Symbol('AbortError'))).toBe(false);
  });

  it('still detects an AbortError-named object', () => {
    expect(authRequestErrors.isAbortError({ name: 'AbortError' })).toBe(true);
  });

  it('rejects a callable that carries UiError-shaped properties', () => {
    const callable = Object.assign(() => undefined, {
      displayMessage: 'Not a UiError',
      retryable: true,
    });

    expect(authRequestErrors.isUiError(callable)).toBe(false);
  });

  it('delegates a UiError-shaped callable to the injected handler', () => {
    const fallback = { displayMessage: 'Handled', retryable: false };
    const callable = Object.assign(() => undefined, {
      displayMessage: 'Not a UiError',
      retryable: true,
    });
    handle.mockReturnValue(fallback);

    expect(authRequestErrors.toUiError(callable)).toBe(fallback);
    expect(handle).toHaveBeenCalledWith(callable);
  });

  it('rejects objects without a string displayMessage', () => {
    expect(authRequestErrors.isUiError({ retryable: true })).toBe(false);
    expect(authRequestErrors.isUiError({ displayMessage: 42, retryable: false })).toBe(false);
    expect(authRequestErrors.isUiError({})).toBe(false);
  });

  it('accepts a fully UiError-shaped object', () => {
    expect(authRequestErrors.isUiError({ displayMessage: 'Boom', retryable: false })).toBe(true);
  });
});
