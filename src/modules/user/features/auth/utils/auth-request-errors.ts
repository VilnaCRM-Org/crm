import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import AuthErrorHandler, { type UiError } from '@auth/utils/auth-error-handler';

@injectable()
export default class AuthRequestErrors {
  constructor(
    @inject(TOKENS.AuthErrorHandler) private readonly authErrorHandler: AuthErrorHandler
  ) {}

  public isAbortError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: unknown }).name === 'AbortError'
    );
  }

  public isUiError(error: unknown): error is UiError {
    if (typeof error !== 'object' || error === null) return false;
    const candidate = error as { displayMessage?: unknown; retryable?: unknown };
    return typeof candidate.displayMessage === 'string' && typeof candidate.retryable === 'boolean';
  }

  public toUiError(error: unknown): UiError {
    return this.isUiError(error) ? error : this.authErrorHandler.handle(error);
  }

  public createValidationUiError(errors: string[], retryable: boolean, separator: string): UiError {
    return {
      displayMessage: errors.join(separator),
      retryable,
    };
  }
}
