import ApiError from './ApiError';

export default class ValidationError extends ApiError {
  constructor(message = 'Invalid data provided') {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
