import ApiError from './ApiError';
import { ApiErrorCodes } from './ApiErrorCodes';

export type ValidationErrorOptions = Readonly<{
  message?: string;
  status?: 400 | 422;
  cause?: unknown;
}>;

export default class ValidationError extends ApiError {
  constructor(options: ValidationErrorOptions = {}) {
    const { message = 'Invalid data provided', status = 400, cause } = options;
    super(message, ApiErrorCodes.VALIDATION, status, cause);
    this.name = 'ValidationError';
  }
}
