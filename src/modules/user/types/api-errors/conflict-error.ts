import ApiError from './api-error';
import { ApiErrorCodes } from './api-error-codes';

export default class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super({ message, code: ApiErrorCodes.CONFLICT, status: 409 });
    this.name = 'ConflictError';
  }
}
