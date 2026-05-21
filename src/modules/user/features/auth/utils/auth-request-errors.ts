import {
  handleAuthError,
  type UiError,
} from '@/modules/user/features/auth/utils/handle-auth-error';

export const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name?: unknown }).name === 'AbortError';

export const isUiError = (error: unknown): error is UiError => {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { displayMessage?: unknown; retryable?: unknown };
  return typeof candidate.displayMessage === 'string' && typeof candidate.retryable === 'boolean';
};

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
