import ApiError from './api-error';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class AuthenticationError extends ApiError {
  constructor(message = 'Invalid credentials') {
    super({ message, code: ApiErrorCodes.AUTH, status: 401 });
  }
}
