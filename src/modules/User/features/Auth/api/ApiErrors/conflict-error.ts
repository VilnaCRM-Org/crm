import ApiError from '@auth/api/ApiErrors/api-error';
import { ApiErrorCodes } from '@auth/api/ApiErrors/api-error-codes';

export default class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super({ message, code: ApiErrorCodes.CONFLICT, status: 409 });
    this.name = 'ConflictError';
  }
}
