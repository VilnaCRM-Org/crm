import ApiError from './ApiError';

export default class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 'CONFLICT_ERROR', 409);
  }
}
