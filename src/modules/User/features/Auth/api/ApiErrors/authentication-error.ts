import ApiError from '@/modules/User/features/Auth/api/ApiErrors/api-error';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors/api-error-codes';

export default class AuthenticationError extends ApiError {
  constructor(message = 'Invalid credentials') {
    super({ message, code: ApiErrorCodes.AUTH, status: 401 });
    this.name = 'AuthenticationError';
  }
}
