import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { ErrorHandler, type UiError } from '@/services/error';
import ErrorParser from '@/utils/error/error-parser';

export type { UiError };

@injectable()
export default class AuthErrorHandler {
  constructor(
    @inject(TOKENS.ErrorHandler) private readonly errorHandler: ErrorHandler,
    @inject(TOKENS.ErrorParser) private readonly errorParser: ErrorParser
  ) {}

  public handle(error: unknown): UiError {
    return this.errorHandler.handleAuthError(this.errorParser.parseHttpError(error));
  }
}
