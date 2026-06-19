import type { ValidationErrorOptions } from '@/modules/user/types/api-errors/validation-error';

import ApiError from './api-error';
import { ApiErrorCodes } from './api-error-codes';

export default class ValidationError extends ApiError {
  constructor(options: ValidationErrorOptions = {}) {
    const { message = 'Invalid data provided', status = 400, cause } = options;
    super({ message, code: ApiErrorCodes.VALIDATION, status, cause });
    this.name = 'ValidationError';
  }
}
