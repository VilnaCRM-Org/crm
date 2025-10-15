import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors/ApiErrorCodes';
import ValidationError from '@/modules/User/features/Auth/api/ApiErrors/ValidationError';

describe('ValidationError', () => {
  describe('constructor', () => {
    it('should create error with default values', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.cause).toBeUndefined();
    });

    it('should create error with custom message', () => {
      const error = new ValidationError({ message: 'Custom validation error' });

      expect(error.message).toBe('Custom validation error');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create error with status 422', () => {
      const error = new ValidationError({ status: 422 });

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(422);
      expect(error.name).toBe('ValidationError');
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new ValidationError({ cause });

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.cause).toBe(cause);
    });

    it('should create error with all custom options', () => {
      const cause = { field: 'email', reason: 'invalid' };
      const error = new ValidationError({
        message: 'Email is invalid',
        status: 422,
        cause,
      });

      expect(error.message).toBe('Email is invalid');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(422);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ValidationError');
    });

    it('should create error with empty message', () => {
      const error = new ValidationError({ message: '' });

      expect(error.message).toBe('');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
    });

    it('should create error with empty options object', () => {
      const error = new ValidationError({});

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
    });

    it('should create error with cause as string', () => {
      const error = new ValidationError({ cause: 'validation failed' });

      expect(error.cause).toBe('validation failed');
    });

    it('should create error with cause as null', () => {
      const error = new ValidationError({ cause: null });

      expect(error.cause).toBeNull();
    });
  });

  describe('inheritance', () => {
    it('should extend ApiError', () => {
      const error = new ValidationError();

      expect(error instanceof ApiError).toBe(true);
    });

    it('should be instance of Error', () => {
      const error = new ValidationError();

      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of ValidationError', () => {
      const error = new ValidationError();

      expect(error instanceof ValidationError).toBe(true);
    });

    it('should have correct prototype chain', () => {
      const error = new ValidationError();

      expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
      expect(Object.getPrototypeOf(ValidationError.prototype)).toBe(ApiError.prototype);
    });
  });

  describe('properties', () => {
    it('should have correct error code', () => {
      const error = new ValidationError();

      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('should have correct name', () => {
      const error = new ValidationError();

      expect(error.name).toBe('ValidationError');
    });

    it('should have code property set correctly', () => {
      const error = new ValidationError();

      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have status property set correctly', () => {
      const error = new ValidationError();

      expect(error.status).toBe(400);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have cause property when provided', () => {
      const error = new ValidationError({ cause: 'test' });

      expect(error.cause).toBe('test');
      // TypeScript enforces readonly at compile-time, not runtime
    });
  });

  describe('stack trace', () => {
    it('should have stack trace', () => {
      const error = new ValidationError();

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should include error message in stack', () => {
      const error = new ValidationError({ message: 'Custom error' });

      expect(error.stack).toContain('Custom error');
    });

    it('should include ValidationError in stack', () => {
      const error = new ValidationError();

      expect(error.stack).toContain('ValidationError');
    });
  });

  describe('status codes', () => {
    it('should accept status 400', () => {
      const error = new ValidationError({ status: 400 });

      expect(error.status).toBe(400);
    });

    it('should accept status 422', () => {
      const error = new ValidationError({ status: 422 });

      expect(error.status).toBe(422);
    });

    it('should default to 400 when status not provided', () => {
      const error = new ValidationError({ message: 'Test' });

      expect(error.status).toBe(400);
    });
  });

  describe('throw and catch', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new ValidationError();
      }).toThrow(Error);
    });

    it('should be catchable as ApiError', () => {
      expect(() => {
        throw new ValidationError();
      }).toThrow(ApiError);
    });

    it('should be catchable as ValidationError', () => {
      expect(() => {
        throw new ValidationError();
      }).toThrow(ValidationError);
    });

    it('should preserve error details when caught', () => {
      try {
        throw new ValidationError({ message: 'Field is required', status: 422 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.message).toBe('Field is required');
          expect(error.status).toBe(422);
          expect(error.code).toBe(ApiErrorCodes.VALIDATION);
        }
      }
    });

    it('should work with Promise.reject', async () => {
      await expect(
        Promise.reject(new ValidationError({ message: 'Validation failed' }))
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle form validation error', () => {
      const error = new ValidationError({
        message: 'Email is required',
        status: 400,
        cause: { field: 'email', value: '' },
      });

      expect(error.message).toBe('Email is required');
      expect(error.status).toBe(400);
      expect(error.cause).toEqual({ field: 'email', value: '' });
    });

    it('should handle multiple field validation errors', () => {
      const cause = {
        fields: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Password too short' },
        ],
      };
      const error = new ValidationError({
        message: 'Multiple validation errors',
        status: 422,
        cause,
      });

      expect(error.message).toBe('Multiple validation errors');
      expect(error.status).toBe(422);
      expect(error.cause).toBe(cause);
    });

    it('should handle API response validation error', () => {
      const apiResponse = {
        status: 422,
        data: {
          errors: [{ field: 'username', message: 'Already taken' }],
        },
      };
      const error = new ValidationError({
        message: 'Username is already taken',
        status: 422,
        cause: apiResponse,
      });

      expect(error.message).toBe('Username is already taken');
      expect(error.cause).toBe(apiResponse);
    });
  });

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new ValidationError({ message: longMessage });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle special characters in message', () => {
      const message = 'Validation failed: @#$%^&*()!';
      const error = new ValidationError({ message });

      expect(error.message).toBe(message);
    });

    it('should handle Unicode characters in message', () => {
      const message = "Помилка валідації: поле обов'язкове";
      const error = new ValidationError({ message });

      expect(error.message).toBe(message);
    });

    it('should handle cause as Error instance', () => {
      const cause = new TypeError('Invalid type');
      const error = new ValidationError({ cause });

      expect(error.cause).toBe(cause);
      expect(error.cause instanceof TypeError).toBe(true);
    });

    it('should handle cause as complex object', () => {
      const cause = {
        fields: ['email', 'password'],
        timestamp: Date.now(),
        metadata: { source: 'form' },
      };
      const error = new ValidationError({ cause });

      expect(error.cause).toBe(cause);
    });

    it('should handle cause as array', () => {
      const cause = ['error1', 'error2', 'error3'];
      const error = new ValidationError({ cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('comparison with other errors', () => {
    it('should be distinguishable from ApiError', () => {
      const validationError = new ValidationError();
      const apiError = new ApiError('Test', 'CODE');

      expect(validationError instanceof ValidationError).toBe(true);
      expect(apiError instanceof ValidationError).toBe(false);
    });

    it('should be distinguishable from standard Error', () => {
      const validationError = new ValidationError();
      const standardError = new Error('Test');

      expect(validationError instanceof ValidationError).toBe(true);
      expect(standardError instanceof ValidationError).toBe(false);
    });

    it('should have different name than ApiError', () => {
      const validationError = new ValidationError();
      const apiError = new ApiError('Test', 'CODE');

      expect(validationError.name).toBe('ValidationError');
      expect(apiError.name).toBe('ApiError');
    });
  });

  describe('serialization', () => {
    it('should be serializable to JSON', () => {
      const error = new ValidationError({ message: 'Test' });

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
    });

    it('should include custom properties in JSON serialization', () => {
      const error = new ValidationError({ message: 'Custom message' });

      const parsed = JSON.parse(JSON.stringify(error));
      // Error.message is not enumerable by default, but custom properties are
      expect(parsed.code).toBe(ApiErrorCodes.VALIDATION);
      expect(parsed.status).toBe(400);
    });

    it('should handle serialization with complex cause', () => {
      const cause = { fields: [{ name: 'email', error: 'invalid' }] };
      const error = new ValidationError({ cause });

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed.cause).toEqual(cause);
    });
  });
});
