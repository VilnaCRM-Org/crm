import { inject, injectable } from 'tsyringe';

import type { ErrorHandler, UiError } from '@/services/error';
import ERROR_TOKENS from '@/services/error/tokens';
import type ErrorParser from '@/utils/error/error-parser';
import ERROR_UTILS_TOKENS from '@/utils/error/tokens';

export type { UiError };

@injectable()
export default class AuthErrorHandler {
  constructor(
    @inject(ERROR_TOKENS.ErrorHandler) private readonly errorHandler: ErrorHandler,
    @inject(ERROR_UTILS_TOKENS.ErrorParser) private readonly errorParser: ErrorParser
  ) {}

  public handle(error: unknown): UiError {
    return this.errorHandler.handleAuthError(this.errorParser.parseHttpError(error));
  }
}
