import { injectable } from 'tsyringe';

import type { UiError } from '@/services/error';

import type { AuthError, FieldIssue } from '../types/auth-error';

@injectable()
export default class AuthErrorFactory {
  public fromUiError(error: UiError): AuthError {
    return { kind: 'unknown', displayMessage: error.displayMessage, retryable: error.retryable };
  }

  public fromValidationIssues(displayMessage: string, issues: readonly FieldIssue[]): AuthError {
    return { kind: 'validation', displayMessage, retryable: false, issues };
  }
}
