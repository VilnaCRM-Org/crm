import { HttpError, isHttpError } from '@/services/HttpsClient/HttpError';

describe('HttpError', () => {
  describe('constructor', () => {
    it('should create error with status and message', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(error.status).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.name).toBe('HttpError');
      expect(error.cause).toBeUndefined();
    });

    it('should create error with status, message, and cause', () => {
      const cause = { url: 'https://api.example.com', body: 'error details' };
      const error = new HttpError({ status: 500, message: 'Server Error', cause });

      expect(error.status).toBe(500);
      expect(error.message).toBe('Server Error');
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('HttpError');
    });

    it('should create error with status 0', () => {
      const error = new HttpError({ status: 0, message: 'Network Error' });

      expect(error.status).toBe(0);
      expect(error.message).toBe('Network Error');
    });

    it('should create error with empty message', () => {
      const error = new HttpError({ status: 400, message: '' });

      expect(error.status).toBe(400);
      expect(error.message).toBe('');
    });

    it('should create error with cause as Error instance', () => {
      const cause = new TypeError('Invalid type');
      const error = new HttpError({ status: 400, message: 'Bad Request', cause });

      expect(error.cause).toBe(cause);
      expect(error.cause instanceof TypeError).toBe(true);
    });

    it('should create error with cause as string', () => {
      const error = new HttpError({ status: 403, message: 'Forbidden', cause: 'Access denied' });

      expect(error.cause).toBe('Access denied');
    });

    it('should create error with cause as null', () => {
      const error = new HttpError({ status: 404, message: 'Not Found', cause: null });

      expect(error.cause).toBeNull();
    });

    it('should create error with complex cause object', () => {
      const cause = {
        url: 'https://api.example.com/users',
        contentType: 'application/json',
        body: { error: 'User not found' },
      };
      const error = new HttpError({ status: 404, message: 'Not Found', cause });

      expect(error.cause).toEqual(cause);
    });
  });

  describe('inheritance', () => {
    it('should be instance of Error', () => {
      const error = new HttpError({ status: 500, message: 'Server Error' });

      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of HttpError', () => {
      const error = new HttpError({ status: 500, message: 'Server Error' });

      expect(error instanceof HttpError).toBe(true);
    });

    it('should have correct prototype chain', () => {
      const error = new HttpError({ status: 500, message: 'Server Error' });

      expect(Object.getPrototypeOf(error)).toBe(HttpError.prototype);
    });
  });

  describe('properties', () => {
    it('should have status property', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(error.status).toBe(404);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have cause property when provided', () => {
      const error = new HttpError({ status: 404, message: 'Not Found', cause: 'test' });

      expect(error.cause).toBe('test');
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should allow modifying message property', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      error.message = 'Modified message';
      expect(error.message).toBe('Modified message');
    });

    it('should have correct name', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(error.name).toBe('HttpError');
    });
  });

  describe('toJSON method', () => {
    it('should serialize to JSON with all properties', () => {
      const cause = { url: 'https://api.example.com', body: 'error' };
      const error = new HttpError({ status: 404, message: 'Not Found', cause });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'HttpError',
        message: 'Not Found',
        status: 404,
        cause,
      });
    });

    it('should serialize to JSON without cause', () => {
      const error = new HttpError({ status: 500, message: 'Server Error' });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'HttpError',
        message: 'Server Error',
        status: 500,
      });
    });

    it('should handle JSON.stringify', () => {
      const error = new HttpError({ status: 400, message: 'Bad Request' });

      const jsonString = JSON.stringify(error);
      const parsed = JSON.parse(jsonString);

      expect(parsed.name).toBe('HttpError');
      expect(parsed.message).toBe('Bad Request');
      expect(parsed.status).toBe(400);
    });

    it('should serialize with cause as null', () => {
      const error = new HttpError({ status: 404, message: 'Not Found', cause: null });

      const json = error.toJSON();

      expect(json.cause).toBeNull();
    });

    it('should serialize with complex cause', () => {
      const cause = {
        url: 'https://example.com',
        contentType: 'application/json',
        body: { errors: ['error1', 'error2'] },
      };
      const error = new HttpError({ status: 422, message: 'Validation Error', cause });

      const json = error.toJSON();

      expect(json.cause).toEqual(cause);
    });
  });

  describe('stack trace', () => {
    it('should have stack trace', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should include error message in stack', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(error.stack).toContain('Not Found');
    });

    it('should include HttpError in stack', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(error.stack).toContain('HttpError');
    });
  });

  describe('HTTP status codes', () => {
    it('should handle various client error status codes', () => {
      const statuses = [400, 401, 403, 404, 409, 422, 429];

      statuses.forEach((status) => {
        const error = new HttpError({ status, message: `Error ${status}` });
        expect(error.status).toBe(status);
      });
    });

    it('should handle various server error status codes', () => {
      const statuses = [500, 501, 502, 503, 504];

      statuses.forEach((status) => {
        const error = new HttpError({ status, message: `Error ${status}` });
        expect(error.status).toBe(status);
      });
    });

    it('should handle success status codes', () => {
      const statuses = [200, 201, 204];

      statuses.forEach((status) => {
        const error = new HttpError({ status, message: `Status ${status}` });
        expect(error.status).toBe(status);
      });
    });

    it('should handle negative status code', () => {
      const error = new HttpError({ status: -1, message: 'Invalid status' });

      expect(error.status).toBe(-1);
    });
  });

  describe('throw and catch', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new HttpError({ status: 404, message: 'Not Found' });
      }).toThrow(Error);
    });

    it('should be catchable as HttpError', () => {
      expect(() => {
        throw new HttpError({ status: 404, message: 'Not Found' });
      }).toThrow(HttpError);
    });

    it('should preserve error details when caught', () => {
      try {
        throw new HttpError({ status: 500, message: 'Server Error', cause: 'timeout' });
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.status).toBe(500);
          expect(error.message).toBe('Server Error');
          expect(error.cause).toBe('timeout');
        }
      }
    });

    it('should work with Promise.reject', async () => {
      await expect(
        Promise.reject(new HttpError({ status: 404, message: 'Not Found' }))
      ).rejects.toThrow(HttpError);
    });
  });

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new HttpError({ status: 400, message: longMessage });

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle special characters in message', () => {
      const message = 'Error: @#$%^&*()!';
      const error = new HttpError({ status: 400, message });

      expect(error.message).toBe(message);
    });

    it('should handle Unicode characters in message', () => {
      const message = 'Помилка: не знайдено';
      const error = new HttpError({ status: 404, message });

      expect(error.message).toBe(message);
    });

    it('should handle newlines in message', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const error = new HttpError({ status: 400, message });

      expect(error.message).toBe(message);
    });

    it('should handle cause as circular reference', () => {
      type CircularCause = {
        self: CircularCause | null;
      };
      const cause: CircularCause = { self: null };
      cause.self = cause;

      const error = new HttpError({ status: 500, message: 'Error', cause });

      expect(error.cause).toBe(cause);
    });
  });
});

describe('isHttpError', () => {
  describe('valid HttpError instances', () => {
    it('should return true for HttpError instance', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(isHttpError(error)).toBe(true);
    });

    it('should return true for HttpError with cause', () => {
      const error = new HttpError({ status: 500, message: 'Error', cause: 'test' });

      expect(isHttpError(error)).toBe(true);
    });

    it('should return true for HttpError with status 0', () => {
      const error = new HttpError({ status: 0, message: 'Network Error' });

      expect(isHttpError(error)).toBe(true);
    });
  });

  describe('object duck-typing', () => {
    it('should return true for object with name HttpError and status number', () => {
      const error = { name: 'HttpError', status: 404, message: 'Not Found' };

      expect(isHttpError(error)).toBe(true);
    });

    it('should return true for object with name HttpError, status 0', () => {
      const error = { name: 'HttpError', status: 0 };

      expect(isHttpError(error)).toBe(true);
    });

    it('should return false for object with name HttpError but non-number status', () => {
      const error = { name: 'HttpError', status: '404' };

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for object with status but wrong name', () => {
      const error = { name: 'Error', status: 404 };

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for object without name', () => {
      const error = { status: 404, message: 'Not Found' };

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for object without status', () => {
      const error = { name: 'HttpError', message: 'Not Found' };

      expect(isHttpError(error)).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('should return false for null', () => {
      expect(isHttpError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isHttpError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isHttpError('error')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isHttpError(404)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isHttpError(true)).toBe(false);
      expect(isHttpError(false)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isHttpError([])).toBe(false);
      expect(isHttpError([{ name: 'HttpError', status: 404 }])).toBe(false);
    });

    it('should return false for function', () => {
      expect(isHttpError(() => {})).toBe(false);
    });

    it('should return false for Symbol', () => {
      expect(isHttpError(Symbol('error'))).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isHttpError({})).toBe(false);
    });
  });

  describe('Error instances', () => {
    it('should return false for standard Error', () => {
      const error = new Error('Standard error');

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for TypeError', () => {
      const error = new TypeError('Type error');

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for custom Error with name HttpError but no status', () => {
      const error = new Error('Error');
      error.name = 'HttpError';

      expect(isHttpError(error)).toBe(false);
    });

    it('should return true for custom Error with name HttpError and status', () => {
      const error = new Error('Error') as Error & { status: number; name: string };
      error.name = 'HttpError';
      error.status = 404;

      expect(isHttpError(error)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle object with getters', () => {
      const error = {
        get name(): string {
          return 'HttpError';
        },
        get status(): number {
          return 404;
        },
      };

      expect(isHttpError(error)).toBe(true);
    });

    it('should handle object created with Object.create', () => {
      const error = Object.create({ name: 'HttpError', status: 404 });

      expect(isHttpError(error)).toBe(true);
    });

    it('should handle object with null prototype', () => {
      const error = Object.create(null);
      error.name = 'HttpError';
      error.status = 404;

      expect(isHttpError(error)).toBe(true);
    });

    it('should handle frozen object', () => {
      const error = Object.freeze({ name: 'HttpError', status: 404 });

      expect(isHttpError(error)).toBe(true);
    });

    it('should handle sealed object', () => {
      const error = Object.seal({ name: 'HttpError', status: 404 });

      expect(isHttpError(error)).toBe(true);
    });

    it('should return false for object with status as string', () => {
      const error = { name: 'HttpError', status: '404' };

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for object with status as null', () => {
      const error = { name: 'HttpError', status: null };

      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for object with status as object', () => {
      const error = { name: 'HttpError', status: { code: 404 } };

      expect(isHttpError(error)).toBe(false);
    });
  });

  describe('type guard behavior', () => {
    it('should narrow type correctly in TypeScript', () => {
      const error: unknown = new HttpError({ status: 404, message: 'Not Found' });

      if (isHttpError(error)) {
        expect(error.status).toBe(404);
        expect(error.name).toBe('HttpError');
      }
    });

    it('should work with union types', () => {
      const errors: unknown[] = [
        new HttpError({ status: 404, message: 'Not Found' }),
        new Error('Standard error'),
        null,
        { name: 'HttpError', status: 500 },
      ];

      const httpErrors = errors.filter(isHttpError);
      expect(httpErrors).toHaveLength(2);
    });
  });

  describe('consistency', () => {
    it('should return same result for same input', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });

      expect(isHttpError(error)).toBe(isHttpError(error));
    });

    it('should be deterministic', () => {
      const error = new HttpError({ status: 404, message: 'Not Found' });
      const results = Array.from({ length: 10 }, () => isHttpError(error));
      const allSame = results.every((result) => result === results[0]);

      expect(allSame).toBe(true);
    });
  });
});
