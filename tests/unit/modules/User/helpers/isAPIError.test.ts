import isAPIError from '@/modules/User/helpers/isAPIError';

describe('isAPIError', () => {
  describe('valid API errors', () => {
    it('should return true for object with code and message strings', () => {
      const error = {
        code: 'ERROR_CODE',
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should return true for API error with additional properties', () => {
      const error = {
        code: 'ERROR_CODE',
        message: 'Error message',
        details: 'Additional details',
        timestamp: Date.now(),
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should return true for empty strings', () => {
      const error = {
        code: '',
        message: '',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should return true for API error with numeric code as string', () => {
      const error = {
        code: '404',
        message: 'Not found',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should return true for API error with long message', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'A'.repeat(1000),
      };
      expect(isAPIError(error)).toBe(true);
    });
  });

  describe('invalid API errors - wrong types', () => {
    it('should return false for null', () => {
      expect(isAPIError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAPIError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isAPIError('error string')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isAPIError(123)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isAPIError(true)).toBe(false);
      expect(isAPIError(false)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isAPIError([])).toBe(false);
      expect(isAPIError(['error'])).toBe(false);
    });

    it('should return false for array with objects', () => {
      expect(isAPIError([{ code: 'ERROR', message: 'Message' }])).toBe(false);
    });

    it('should return false for function', () => {
      expect(isAPIError(() => {})).toBe(false);
    });

    it('should return false for Symbol', () => {
      expect(isAPIError(Symbol('error'))).toBe(false);
    });
  });

  describe('invalid API errors - missing properties', () => {
    it('should return false for object without code', () => {
      const error = {
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false for object without message', () => {
      const error = {
        code: 'ERROR_CODE',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isAPIError({})).toBe(false);
    });

    it('should return false for object with only other properties', () => {
      const error = {
        status: 500,
        details: 'Some details',
      };
      expect(isAPIError(error)).toBe(false);
    });
  });

  describe('invalid API errors - wrong property types', () => {
    it('should return false when code is not a string', () => {
      const error = {
        code: 123,
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when message is not a string', () => {
      const error = {
        code: 'ERROR_CODE',
        message: 123,
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when code is null', () => {
      const error = {
        code: null,
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when message is null', () => {
      const error = {
        code: 'ERROR_CODE',
        message: null,
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when code is undefined', () => {
      const error = {
        code: undefined,
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when message is undefined', () => {
      const error = {
        code: 'ERROR_CODE',
        message: undefined,
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when code is an object', () => {
      const error = {
        code: { value: 'ERROR_CODE' },
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when message is an object', () => {
      const error = {
        code: 'ERROR_CODE',
        message: { text: 'Error message' },
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when code is an array', () => {
      const error = {
        code: ['ERROR_CODE'],
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when message is an array', () => {
      const error = {
        code: 'ERROR_CODE',
        message: ['Error message'],
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when code is boolean', () => {
      const error = {
        code: true,
        message: 'Error message',
      };
      expect(isAPIError(error)).toBe(false);
    });

    it('should return false when message is boolean', () => {
      const error = {
        code: 'ERROR_CODE',
        message: false,
      };
      expect(isAPIError(error)).toBe(false);
    });
  });

  describe('Error instances', () => {
    it('should return false for Error instance without code', () => {
      const error = new Error('Error message');
      expect(isAPIError(error)).toBe(false);
    });

    it('should return true for Error instance with code and message', () => {
      type WithCode<T extends Error = Error> = T & { code?: string };
      const error: WithCode = new Error('Error message');
      error.code = 'ERROR_CODE';
      expect(isAPIError(error)).toBe(true);
    });

    it('should return false for TypeError instance', () => {
      const error = new TypeError('Type error');
      expect(isAPIError(error)).toBe(false);
    });

    it('should return true for custom Error with code property', () => {
      class APIErrorClass extends Error {
        public readonly code: string;

        constructor(code: string, message: string) {
          super(message);
          this.code = code;
        }
      }

      const error = new APIErrorClass('ERROR_CODE', 'Error message');
      expect(isAPIError(error)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle object with getters', () => {
      const error = {
        get code(): string {
          return 'ERROR_CODE';
        },
        get message(): string {
          return 'Error message';
        },
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object created with Object.create', () => {
      const error = Object.create({
        code: 'ERROR_CODE',
        message: 'Error message',
      });
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object with null prototype', () => {
      const error = Object.create(null);
      error.code = 'ERROR_CODE';
      error.message = 'Error message';
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle frozen object', () => {
      const error = Object.freeze({
        code: 'ERROR_CODE',
        message: 'Error message',
      });
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle sealed object', () => {
      const error = Object.seal({
        code: 'ERROR_CODE',
        message: 'Error message',
      });
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object with numeric string code', () => {
      const error = {
        code: '0',
        message: '0',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object with whitespace strings', () => {
      const error = {
        code: '   ',
        message: '   ',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object with special characters in strings', () => {
      const error = {
        code: 'ERROR-CODE_123',
        message: 'Error: message with special chars!@#$%',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object with Unicode characters', () => {
      const error = {
        code: 'ПОМИЛКА',
        message: 'Повідомлення про помилку',
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle object with emojis', () => {
      const error = {
        code: '❌ ERROR',
        message: '⚠️ Error message',
      };
      expect(isAPIError(error)).toBe(true);
    });
  });

  describe('type guard behavior', () => {
    it('should narrow type correctly in TypeScript', () => {
      const error: unknown = {
        code: 'ERROR_CODE',
        message: 'Error message',
      };

      if (isAPIError(error)) {
        // TypeScript should recognize error as having code and message
        expect(error.code).toBe('ERROR_CODE');
        expect(error.message).toBe('Error message');
      }
    });

    it('should work with union types', () => {
      const errors: unknown[] = [
        { code: 'ERROR_1', message: 'Message 1' },
        'string error',
        null,
        { code: 'ERROR_2', message: 'Message 2' },
      ];

      const apiErrors = errors.filter(isAPIError);
      expect(apiErrors).toHaveLength(2);
    });
  });

  describe('consistency', () => {
    it('should return same result for same input', () => {
      const error = { code: 'ERROR', message: 'Message' };
      expect(isAPIError(error)).toBe(isAPIError(error));
    });

    it('should be deterministic', () => {
      const error = { code: 'ERROR', message: 'Message' };
      const results = Array.from({ length: 10 }, () => isAPIError(error));
      const allSame = results.every((result) => result === results[0]);
      expect(allSame).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle HTTP 404 error format', () => {
      const error = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        status: 404,
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle validation error format', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        fields: ['email', 'password'],
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should handle authentication error format', () => {
      const error = {
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
        statusCode: 401,
      };
      expect(isAPIError(error)).toBe(true);
    });

    it('should reject plain Error objects', () => {
      const error = new Error('Network error');
      expect(isAPIError(error)).toBe(false);
    });
  });
});
