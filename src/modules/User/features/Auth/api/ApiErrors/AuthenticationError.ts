import ApiError from './ApiError';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class AuthenticationError extends ApiError {
  constructor(message = 'Invalid credentials') {
    super(message, ApiErrorCodes.AUTH, 401);
  }
}
