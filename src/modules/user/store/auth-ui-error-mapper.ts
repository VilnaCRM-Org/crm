import { ErrorHandler, type UiError } from '@/services/error';
import ErrorParser from '@/utils/error/error-parser';

export default class AuthUiErrorMapper {
  private readonly errorParser: ErrorParser;

  constructor(errorParser: ErrorParser = new ErrorParser()) {
    this.errorParser = errorParser;
  }

  public map(error: unknown): UiError {
    return ErrorHandler.handleAuthError(this.errorParser.parseHttpError(error));
  }
}
