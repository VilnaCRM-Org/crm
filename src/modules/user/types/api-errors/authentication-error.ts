import ApiError from './api-error';
import { ApiErrorCodes } from './api-error-codes';

export default class AuthenticationError extends ApiError {
  constructor(message = 'Invalid credentials') {
    super(message, ApiErrorCodes.AUTH, 401);
  }
}
