import { inject, injectable } from 'tsyringe';

import type { UiError } from '@/services/error';
import type ErrorParser from '@/utils/error/error-parser';
import ERROR_UTILS_TOKENS from '@/utils/error/tokens';

import type { AuthError, AuthErrorKind } from '../types/auth-error';

const KIND_BY_CODE: Readonly<Record<string, AuthErrorKind>> = {
  AUTH_INVALID: 'authentication',
  AUTHENTICATION_ERROR: 'authentication',
  HTTP_401: 'authentication',
  VALIDATION_ERROR: 'validation',
  CONFLICT_ERROR: 'conflict',
  SERVER_ERROR: 'server',
  SERVICE_UNAVAILABLE_ERROR: 'server',
  RATE_LIMITED: 'server',
  HTTP_500: 'server',
  NETWORK_ERROR: 'network',
  TIMEOUT: 'network',
};

@injectable()
export default class AuthErrorFactory {
  constructor(@inject(ERROR_UTILS_TOKENS.ErrorParser) private readonly errorParser: ErrorParser) {}

  public fromUiError(error: UiError, cause?: unknown): AuthError {
    const parsed = cause === undefined ? undefined : this.errorParser.parseHttpError(cause);
    const status = this.statusOf(parsed?.original);
    return {
      kind: KIND_BY_CODE[parsed?.code ?? ''] ?? 'unknown',
      displayMessage: error.displayMessage,
      retryable: error.retryable,
      ...(status === undefined ? {} : { status }),
    };
  }

  private statusOf(original: unknown): number | undefined {
    const status = (original as { status?: unknown } | null | undefined)?.status;
    return typeof status === 'number' ? status : undefined;
  }
}
