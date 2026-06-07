import { injectable } from 'tsyringe';

import type { UiError } from '@/services/error';

import type { AuthError } from '../types/auth-error';

@injectable()
export default class AuthErrorFactory {
  public fromUiError(error: UiError): AuthError {
    return { kind: 'unknown', displayMessage: error.displayMessage, retryable: error.retryable };
  }
}
