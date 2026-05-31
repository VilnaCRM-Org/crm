import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { ErrorHandler, type UiError } from '@/services/error';
import ErrorParser from '@/utils/error/error-parser';

@injectable()
export default class AuthUiErrorMapper {
  private readonly errorParser: ErrorParser;

  constructor(@inject(TOKENS.ErrorParser) errorParser: ErrorParser) {
    this.errorParser = errorParser;
  }

  public map(error: unknown): UiError {
    return ErrorHandler.handleAuthError(this.errorParser.parseHttpError(error));
  }
}
