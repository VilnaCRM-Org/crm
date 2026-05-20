import ApiError from '@auth/api/ApiErrors/api-error';
import { ApiErrorCodes } from '@auth/api/ApiErrors/api-error-codes';

export default class AuthenticationError extends ApiError {
  constructor(message = 'Invalid credentials') {
    super({ message, code: ApiErrorCodes.AUTH, status: 401 });
    this.name = 'AuthenticationError';
  }
}
