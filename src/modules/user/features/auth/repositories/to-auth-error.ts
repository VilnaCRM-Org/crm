import type { UiError } from '@/services/error';

import type { AuthError, FieldIssue } from '../types/auth-error';

export const uiErrorToAuthError = (error: UiError): AuthError => ({
  kind: 'unknown',
  displayMessage: error.displayMessage,
  retryable: error.retryable,
});

export const validationIssuesToAuthError = (
  displayMessage: string,
  issues: readonly FieldIssue[]
): AuthError => ({
  kind: 'validation',
  displayMessage,
  retryable: false,
  issues,
});
