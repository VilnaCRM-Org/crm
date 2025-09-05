import ApiError from './ApiError';
import { ApiErrorCodes } from './ApiErrorCodes';

export default class ValidationError extends ApiError {
  constructor(message = 'Invalid data provided') {
    super(message, ApiErrorCodes.VALIDATION, 400);
  }
}
