import ApiError from './ApiError';

export default class AuthenticationError extends ApiError {
  constructor(message = 'Invalid credentials') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}
