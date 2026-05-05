import {
  handleAuthError,
  type UiError,
} from '@/modules/User/features/Auth/utils/handle-auth-error';

export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'AbortError';

export const isUiError = (error: unknown): error is UiError =>
  typeof error === 'object' &&
  error !== null &&
  'displayMessage' in error &&
  typeof (error as { displayMessage: unknown }).displayMessage === 'string' &&
  'retryable' in error &&
  typeof (error as { retryable: unknown }).retryable === 'boolean';

export function toUiError(error: unknown): UiError {
  return isUiError(error) ? error : handleAuthError(error);
}

export function createValidationUiError(
  errors: string[],
  retryable: boolean,
  separator: string
): UiError {
  return {
    displayMessage: errors.join(separator),
    retryable,
  };
}
