import ApiError from './ApiError';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class ValidationError extends ApiError {
  constructor(cause?: unknown, message = 'Invalid data provided', status: 400 | 422 = 400) {
    super(message, ApiErrorCodes.VALIDATION, status, cause);
  }
}
