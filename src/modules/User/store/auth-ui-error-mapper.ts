import { ErrorHandler, type UiError } from '@/services/error';
import ErrorParser from '@/utils/error/error-parser';
import { injectable } from 'tsyringe';

@injectable()
export default class AuthUiErrorMapper {
  private readonly errorParser: ErrorParser;

  constructor(errorParser: ErrorParser = new ErrorParser()) {
    this.errorParser = errorParser;
  }

  public map(error: unknown): UiError {
    return ErrorHandler.handleAuthError(this.errorParser.parseHttpError(error));
  }
}
