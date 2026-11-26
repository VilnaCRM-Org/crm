import '../setup';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
  ApiErrorCodes,
} from '@/modules/user/lib/api-errors';

describe('API Errors Integration', () => {
  describe('ApiError Constructors', () => {
    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth error');

      expect(error.message).toBe('Custom auth error');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
    });

    it('should create ConflictError with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });

    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('Custom conflict error');

      expect(error.message).toBe('Custom conflict error');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });

    it('should create ValidationError with default options', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with custom message', () => {
      const error = new ValidationError({ message: 'Custom validation error' });

      expect(error.message).toBe('Custom validation error');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with status 422', () => {
      const error = new ValidationError({
        message: 'Unprocessable entity',
        status: 422,
      });

      expect(error.message).toBe('Unprocessable entity');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(422);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with cause', () => {
      const cause = new Error('Original error');
      const error = new ValidationError({
        message: 'Validation failed',
        cause,
      });

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with all options', () => {
      const cause = new Error('Root cause');
      const error = new ValidationError({
        message: 'Complex validation error',
        status: 422,
        cause,
      });

      expect(error.message).toBe('Complex validation error');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(422);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ValidationError');
    });
  });
});
