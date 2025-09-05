import ApiError from './ApiError';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, ApiErrorCodes.CONFLICT, 409);
  }
}
