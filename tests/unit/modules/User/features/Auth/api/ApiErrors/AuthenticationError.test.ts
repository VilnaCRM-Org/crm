import ApiError from '@/modules/User/features/Auth/api/ApiErrors/ApiError';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors/ApiErrorCodes';
import AuthenticationError from '@/modules/User/features/Auth/api/ApiErrors/AuthenticationError';

describe('AuthenticationError', () => {
  describe('constructor', () => {
    it('should create error with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
      expect(error.name).toBe('ApiError'); // AuthenticationError doesn't override name
    });

    it('should create error with custom message', () => {
      const error = new AuthenticationError('User not found');

      expect(error.message).toBe('User not found');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
      expect(error.name).toBe('ApiError'); // AuthenticationError doesn't override name
    });

    it('should create error with empty message', () => {
      const error = new AuthenticationError('');

      expect(error.message).toBe('');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
    });

    it('should always have status 401', () => {
      const error1 = new AuthenticationError();
      const error2 = new AuthenticationError('Custom message');

      expect(error1.status).toBe(401);
      expect(error2.status).toBe(401);
    });

    it('should always have AUTH error code', () => {
      const error1 = new AuthenticationError();
      const error2 = new AuthenticationError('Custom message');

      expect(error1.code).toBe('AUTHENTICATION_ERROR');
      expect(error2.code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('inheritance', () => {
    it('should extend ApiError', () => {
      const error = new AuthenticationError();

      expect(error instanceof ApiError).toBe(true);
    });

    it('should be instance of Error', () => {
      const error = new AuthenticationError();

      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of AuthenticationError', () => {
      const error = new AuthenticationError();

      expect(error instanceof AuthenticationError).toBe(true);
    });

    it('should have correct prototype chain', () => {
      const error = new AuthenticationError();

      expect(Object.getPrototypeOf(error)).toBe(AuthenticationError.prototype);
      expect(Object.getPrototypeOf(AuthenticationError.prototype)).toBe(ApiError.prototype);
    });
  });

  describe('properties', () => {
    it('should have correct error code', () => {
      const error = new AuthenticationError();

      expect(error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should have name from parent class', () => {
      const error = new AuthenticationError();

      expect(error.name).toBe('ApiError'); // Inherits from ApiError
    });

    it('should have code property set correctly', () => {
      const error = new AuthenticationError();

      expect(error.code).toBe(ApiErrorCodes.AUTH);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should have status property set correctly', () => {
      const error = new AuthenticationError();

      expect(error.status).toBe(401);
      // TypeScript enforces readonly at compile-time, not runtime
    });

    it('should not have cause property by default', () => {
      const error = new AuthenticationError();

      expect(error.cause).toBeUndefined();
    });
  });

  describe('stack trace', () => {
    it('should have stack trace', () => {
      const error = new AuthenticationError();

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('should include error message in stack', () => {
      const error = new AuthenticationError('Custom auth error');

      expect(error.stack).toContain('Custom auth error');
    });

    it('should include AuthenticationError in stack', () => {
      const error = new AuthenticationError();

      expect(error.stack).toContain('AuthenticationError');
    });
  });

  describe('throw and catch', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new AuthenticationError();
      }).toThrow(Error);
    });

    it('should be catchable as ApiError', () => {
      expect(() => {
        throw new AuthenticationError();
      }).toThrow(ApiError);
    });

    it('should be catchable as AuthenticationError', () => {
      expect(() => {
        throw new AuthenticationError();
      }).toThrow(AuthenticationError);
    });

    it('should preserve error details when caught', () => {
      try {
        throw new AuthenticationError('Session expired');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        if (error instanceof AuthenticationError) {
          expect(error.message).toBe('Session expired');
          expect(error.status).toBe(401);
          expect(error.code).toBe(ApiErrorCodes.AUTH);
        }
      }
    });

    it('should work with Promise.reject', async () => {
      await expect(Promise.reject(new AuthenticationError('Token invalid'))).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe('real-world scenarios', () => {
    it('should handle invalid credentials error', () => {
      const error = new AuthenticationError('Invalid email or password');

      expect(error.message).toBe('Invalid email or password');
      expect(error.status).toBe(401);
      expect(error.code).toBe(ApiErrorCodes.AUTH);
    });

    it('should handle expired token error', () => {
      const error = new AuthenticationError('Token has expired');

      expect(error.message).toBe('Token has expired');
      expect(error.status).toBe(401);
    });

    it('should handle missing credentials error', () => {
      const error = new AuthenticationError('No credentials provided');

      expect(error.message).toBe('No credentials provided');
      expect(error.status).toBe(401);
    });

    it('should handle session timeout error', () => {
      const error = new AuthenticationError('Session timed out');

      expect(error.message).toBe('Session timed out');
      expect(error.status).toBe(401);
    });

    it('should handle user not found error', () => {
      const error = new AuthenticationError('User does not exist');

      expect(error.message).toBe('User does not exist');
      expect(error.status).toBe(401);
    });

    it('should handle account locked error', () => {
      const error = new AuthenticationError(
        'Account is locked due to multiple failed login attempts'
      );

      expect(error.message).toBe('Account is locked due to multiple failed login attempts');
      expect(error.status).toBe(401);
    });
  });

  describe('edge cases', () => {
    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new AuthenticationError(longMessage);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle special characters in message', () => {
      const message = 'Auth failed: @#$%^&*()!';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should handle Unicode characters in message', () => {
      const message = 'Помилка автентифікації: невірні дані';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should handle newlines in message', () => {
      const message =
        'Authentication failed\nPlease try again\nContact support if the issue persists';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should handle message with quotes', () => {
      const message = `Authentication failed: "invalid token"`;
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should handle message with escape sequences', () => {
      const message = 'Error:\t\n\r\b\f';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });
  });

  describe('comparison with other errors', () => {
    it('should be distinguishable from ApiError', () => {
      const authError = new AuthenticationError();
      const apiError = new ApiError('Test', 'CODE');

      expect(authError instanceof AuthenticationError).toBe(true);
      expect(apiError instanceof AuthenticationError).toBe(false);
    });

    it('should be distinguishable from standard Error', () => {
      const authError = new AuthenticationError();
      const standardError = new Error('Test');

      expect(authError instanceof AuthenticationError).toBe(true);
      expect(standardError instanceof AuthenticationError).toBe(false);
    });

    it('should have same name as ApiError', () => {
      const authError = new AuthenticationError();
      const apiError = new ApiError('Test', 'CODE');

      // AuthenticationError inherits name from ApiError
      expect(authError.name).toBe('ApiError');
      expect(apiError.name).toBe('ApiError');
    });

    it('should have same status as HTTP 401', () => {
      const error = new AuthenticationError();

      expect(error.status).toBe(401);
    });
  });

  describe('serialization', () => {
    it('should be serializable to JSON', () => {
      const error = new AuthenticationError('Test auth error');

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
    });

    it('should include custom properties in JSON serialization', () => {
      const error = new AuthenticationError('Custom auth message');

      const parsed = JSON.parse(JSON.stringify(error));
      // Error.message is not enumerable by default, but custom properties are
      expect(parsed.code).toBe(ApiErrorCodes.AUTH);
      expect(parsed.status).toBe(401);
    });

    it('should serialize correctly with default message', () => {
      const error = new AuthenticationError();

      const parsed = JSON.parse(JSON.stringify(error));
      expect(parsed.code).toBe(ApiErrorCodes.AUTH);
      expect(parsed.status).toBe(401);
    });
  });

  describe('message variations', () => {
    it('should accept message with HTML entities', () => {
      const message = 'Error: &lt;token&gt; is invalid';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should accept message with JSON', () => {
      const message = '{"error": "invalid_token", "description": "Token expired"}';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });

    it('should accept message with URL', () => {
      const message = 'Redirect to https://example.com/login for authentication';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
    });
  });
});
