import ApiError from './ApiError';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class ValidationError extends ApiError {
  constructor(
    options: {
      message?: string;
      status?: 400 | 422;
      cause?: unknown;
    } = {}
  ) {
    const { message = 'Invalid data provided', status = 400, cause } = options;
    super(message, ApiErrorCodes.VALIDATION, status, cause);
    this.name = 'ValidationError';
  }
}
