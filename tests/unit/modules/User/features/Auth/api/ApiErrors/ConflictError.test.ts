import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors/ApiErrorCodes';
import ConflictError from '@/modules/User/features/Auth/api/ApiErrors/ConflictError';

describe('ConflictError', () => {
  describe('constructor', () => {
    it('should create error with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
      expect(error.name).toBe('ApiError'); // ConflictError doesn't override name
    });

    it('should create error with custom message', () => {
      const error = new ConflictError('Email already registered');

      expect(error.message).toBe('Email already registered');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
      expect(error.name).toBe('ApiError'); // ConflictError doesn't override name
    });

    it('should create error with empty message', () => {
      const error = new ConflictError('');

      expect(error.message).toBe('');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });

    it('should always have status 409', () => {
      const error1 = new ConflictError();
      const error2 = new ConflictError('Custom message');

      expect(error1.status).toBe(409);
      expect(error2.status).toBe(409);
    });

    it('should always have CONFLICT error code', () => {
      const error1 = new ConflictError();
      const error2 = new ConflictError('Custom message');

      expect(error1.code).toBe('CONFLICT_ERROR');
      expect(error2.code).toBe('CONFLICT_ERROR');
    });
  });

  describe('inheritance', () => {
    it('should extend ApiError', () => {
      const error = new ConflictError();

      expect(error instanceof ApiError).toBe(true);
    });

    it('should be instance of Error', () => {
      const error = new ConflictError();

      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of ConflictError', () => {
      const error = new ConflictError();

      expect(error instanceof ConflictError).toBe(true);
    });

    it('should have correct prototype chain', () => {
      const error = new ConflictError();

      expect(Object.getPrototypeOf(error)).toBe(ConflictError.prototype);
      expect(Object.getPrototypeOf(ConflictError.prototype)).toBe(ApiError.prototype);
    });
  });

  describe('properties', () => {
    it('should have correct error code', () => {
      const error = new ConflictError();

      expect(error.code).toBe('CONFLICT_ERROR');
    });

    it('should have name from parent class', () => {
      const error = new ConflictError();

      expect(error.name).toBe('ApiError'); // Inherits from ApiError
    });

    it('should have code property set correctly', () => {
      const error = new ConflictError();

      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have status property set correctly', () => {
      const error = new ConflictError();

      expect(error.status).toBe(409);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should not have cause property by default', () => {
      const error = new ConflictError();

      expect(error.cause).toBeUndefined();
    });
  });

  describe('stack trace', () => {
    it('should have stack trace', () => {
      const error = new ConflictError();

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should include error message in stack', () => {
      const error = new ConflictError('Custom conflict error');

      expect(error.stack).toContain('Custom conflict error');
    });

    it('should include ConflictError in stack', () => {
      const error = new ConflictError();

      expect(error.stack).toContain('ConflictError');
    });
  });

  describe('throw and catch', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new ConflictError();
      }).toThrow(Error);
    });

    it('should be catchable as ApiError', () => {
      expect(() => {
        throw new ConflictError();
      }).toThrow(ApiError);
    });

    it('should be catchable as ConflictError', () => {
      expect(() => {
        throw new ConflictError();
      }).toThrow(ConflictError);
    });

    it('should preserve error details when caught', () => {
      try {
        throw new ConflictError('Username is taken');
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError);
        if (error instanceof ConflictError) {
          expect(error.message).toBe('Username is taken');
          expect(error.status).toBe(409);
          expect(error.code).toBe(ApiErrorCodes.CONFLICT);
        }
      }
    });

    it('should work with Promise.reject', async () => {
      await expect(Promise.reject(new ConflictError('Resource exists'))).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should handle duplicate email error', () => {
      const error = new ConflictError('Email address is already registered');

      expect(error.message).toBe('Email address is already registered');
      expect(error.status).toBe(409);
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
    });

    it('should handle duplicate username error', () => {
      const error = new ConflictError('Username is already taken');

      expect(error.message).toBe('Username is already taken');
      expect(error.status).toBe(409);
    });

    it('should handle duplicate resource error', () => {
      const error = new ConflictError('A resource with this ID already exists');

      expect(error.message).toBe('A resource with this ID already exists');
      expect(error.status).toBe(409);
    });

    it('should handle concurrent modification error', () => {
      const error = new ConflictError('Resource has been modified by another user');

      expect(error.message).toBe('Resource has been modified by another user');
      expect(error.status).toBe(409);
    });

    it('should handle version conflict error', () => {
      const error = new ConflictError('Version conflict detected');

      expect(error.message).toBe('Version conflict detected');
      expect(error.status).toBe(409);
    });

    it('should handle unique constraint violation', () => {
      const error = new ConflictError('Unique constraint violation: duplicate key');

      expect(error.message).toBe('Unique constraint violation: duplicate key');
      expect(error.status).toBe(409);
    });
  });

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new ConflictError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle special characters in message', () => {
      const message = 'Conflict: @#$%^&*()!';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should handle Unicode characters in message', () => {
      const message = 'Конфлікт: ресурс вже існує';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should handle newlines in message', () => {
      const message =
        'Conflict detected\nResource already exists\nPlease use a different identifier';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should handle message with quotes', () => {
      const message = `Conflict: "user@example.com" already exists`;
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should handle message with escape sequences', () => {
      const message = 'Conflict:\t\n\r\b\f';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });
  });

  describe('comparison with other errors', () => {
    it('should be distinguishable from ApiError', () => {
      const conflictError = new ConflictError();
      const apiError = new ApiError('Test', 'CODE');

      expect(conflictError instanceof ConflictError).toBe(true);
      expect(apiError instanceof ConflictError).toBe(false);
    });

    it('should be distinguishable from standard Error', () => {
      const conflictError = new ConflictError();
      const standardError = new Error('Test');

      expect(conflictError instanceof ConflictError).toBe(true);
      expect(standardError instanceof ConflictError).toBe(false);
    });

    it('should have same name as ApiError', () => {
      const conflictError = new ConflictError();
      const apiError = new ApiError('Test', 'CODE');

      // ConflictError inherits name from ApiError
      expect(conflictError.name).toBe('ApiError');
      expect(apiError.name).toBe('ApiError');
    });

    it('should have same status as HTTP 409', () => {
      const error = new ConflictError();

      expect(error.status).toBe(409);
    });
  });

  describe('serialization', () => {
    it('should be serializable to JSON', () => {
      const error = new ConflictError('Test conflict error');

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
    });

    it('should include custom properties in JSON serialization', () => {
      const error = new ConflictError('Custom conflict message');

      const parsed = JSON.parse(JSON.stringify(error));
      // Error.message is not enumerable by default, but custom properties are
      expect(parsed.code).toBe(ApiErrorCodes.CONFLICT);
      expect(parsed.status).toBe(409);
    });

    it('should serialize correctly with default message', () => {
      const error = new ConflictError();

      const parsed = JSON.parse(JSON.stringify(error));
      expect(parsed.code).toBe(ApiErrorCodes.CONFLICT);
      expect(parsed.status).toBe(409);
    });
  });

  describe('message variations', () => {
    it('should accept message with HTML entities', () => {
      const message = 'Conflict: &lt;resource&gt; already exists';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should accept message with JSON', () => {
      const message = '{"error": "duplicate_entry", "field": "email"}';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should accept message with URL', () => {
      const message = 'Resource at https://example.com/resource/123 already exists';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });

    it('should accept message with database constraint name', () => {
      const message = 'Duplicate entry for key "unique_email_index"';
      const error = new ConflictError(message);

      expect(error.message).toBe(message);
    });
  });

  describe('comparison with similar errors', () => {
    it('should have different status than ValidationError', () => {
      const conflictError = new ConflictError();

      expect(conflictError.status).toBe(409);
      // ValidationError typically uses 400 or 422
    });

    it('should have different code than other ApiError types', () => {
      const error = new ConflictError();

      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.code).not.toBe('VALIDATION_ERROR');
      expect(error.code).not.toBe('AUTHENTICATION_ERROR');
    });
  });
});
