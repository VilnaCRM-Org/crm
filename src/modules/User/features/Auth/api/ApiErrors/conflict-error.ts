import ApiError from './api-error';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super({ message, code: ApiErrorCodes.CONFLICT, status: 409 });
  }
}
