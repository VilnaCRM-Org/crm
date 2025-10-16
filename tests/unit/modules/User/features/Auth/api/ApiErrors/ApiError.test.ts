import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create error with message and code', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ApiError');
      expect(error.status).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('should create error with message, code, and status', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.name).toBe('ApiError');
      expect(error.cause).toBeUndefined();
    });

    it('should create error with all parameters', () => {
      const cause = new Error('Original error');
      const error = new ApiError('Test error', 'TEST_CODE', 500, cause);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(500);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ApiError');
    });

    it('should create error with empty message', () => {
      const error = new ApiError('', 'TEST_CODE');

      expect(error.message).toBe('');
      expect(error.code).toBe('TEST_CODE');
    });

    it('should create error with empty code', () => {
      const error = new ApiError('Test error', '');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('');
    });

    it('should create error with status 0', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 0);

      expect(error.status).toBe(0);
    });

    it('should create error with cause as string', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400, 'string cause');

      expect(error.cause).toBe('string cause');
    });

    it('should create error with cause as object', () => {
      const cause = { key: 'value' };
      const error = new ApiError('Test error', 'TEST_CODE', 400, cause);

      expect(error.cause).toBe(cause);
    });

    it('should create error with cause as null', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400, null);

      expect(error.cause).toBeNull();
    });
  });

  describe('inheritance', () => {
    it('should be instance of Error', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of ApiError', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error instanceof ApiError).toBe(true);
    });

    it('should have correct prototype chain', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
    });
  });

  describe('stack trace', () => {
    it('should have stack trace', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should include error message in stack', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error.stack).toContain('Test error');
    });

    it('should include ApiError in stack', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error.stack).toContain('ApiError');
    });
  });

  describe('properties', () => {
    it('should have code property', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      expect(error.code).toBe('TEST_CODE');
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have status property', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400);

      expect(error.status).toBe(400);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have cause property', () => {
      const cause = new Error('Original');
      const error = new ApiError('Test error', 'TEST_CODE', 400, cause);

      expect(error.cause).toBe(cause);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should allow modifying message property', () => {
      const error = new ApiError('Test error', 'TEST_CODE');

      error.message = 'Modified message';
      expect(error.message).toBe('Modified message');
    });
  });

  describe('serialization', () => {
    it('should be serializable to JSON', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400);

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
    });

    it('should include custom properties in JSON serialization', () => {
      const error = new ApiError('Test error', 'TEST_CODE', 400);

      const parsed = JSON.parse(JSON.stringify(error));
      // Error.message is not enumerable by default, but custom properties are
      expect(parsed.code).toBe('TEST_CODE');
      expect(parsed.status).toBe(400);
    });

    it('should handle serialization with cause', () => {
      const cause = { key: 'value' };
      const error = new ApiError('Test error', 'TEST_CODE', 400, cause);

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(parsed.cause).toEqual(cause);
    });
  });

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new ApiError(longMessage, 'TEST_CODE');

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle special characters in message', () => {
      const message = 'Error: test@#$%^&*()!';
      const error = new ApiError(message, 'TEST_CODE');

      expect(error.message).toBe(message);
    });

    it('should handle Unicode characters in message', () => {
      const message = 'Помилка: тестове повідомлення';
      const error = new ApiError(message, 'TEST_CODE');

      expect(error.message).toBe(message);
    });

    it('should handle newlines in message', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const error = new ApiError(message, 'TEST_CODE');

      expect(error.message).toBe(message);
    });

    it('should handle various HTTP status codes', () => {
      const statuses = [200, 201, 400, 401, 403, 404, 409, 422, 500, 502, 503];

      statuses.forEach((status) => {
        const error = new ApiError('Test', 'CODE', status);
        expect(error.status).toBe(status);
      });
    });

    it('should handle negative status code', () => {
      const error = new ApiError('Test error', 'TEST_CODE', -1);

      expect(error.status).toBe(-1);
    });

    it('should handle cause as Error instance', () => {
      const cause = new TypeError('Type error');
      const error = new ApiError('Test error', 'TEST_CODE', 400, cause);

      expect(error.cause).toBe(cause);
      expect(error.cause instanceof TypeError).toBe(true);
    });

    it('should handle cause as circular reference', () => {
      type CircularCause = {
        self: CircularCause | null;
      };
      const cause: CircularCause = { self: null };
      cause.self = cause;

      const error = new ApiError('Test error', 'TEST_CODE', 400, cause);

      expect(error.cause).toBe(cause);
    });
  });

  describe('throw and catch', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new ApiError('Test error', 'TEST_CODE');
      }).toThrow(Error);
    });

    it('should be catchable as ApiError', () => {
      expect(() => {
        throw new ApiError('Test error', 'TEST_CODE');
      }).toThrow(ApiError);
    });

    it('should preserve error details when caught', () => {
      try {
        throw new ApiError('Test error', 'TEST_CODE', 400);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.message).toBe('Test error');
          expect(error.code).toBe('TEST_CODE');
          expect(error.status).toBe(400);
        }
      }
    });

    it('should work with Promise.reject', async () => {
      await expect(Promise.reject(new ApiError('Test error', 'TEST_CODE'))).rejects.toThrow(
        ApiError
      );
    });
  });

  describe('comparison with other errors', () => {
    it('should be distinguishable from standard Error', () => {
      const apiError = new ApiError('Test error', 'TEST_CODE');
      const standardError = new Error('Test error');

      expect(apiError instanceof ApiError).toBe(true);
      expect(standardError instanceof ApiError).toBe(false);
    });

    it('should have different name than Error', () => {
      const apiError = new ApiError('Test error', 'TEST_CODE');
      const standardError = new Error('Test error');

      expect(apiError.name).toBe('ApiError');
      expect(standardError.name).toBe('Error');
    });
  });
});
