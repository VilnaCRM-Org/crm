// @jest-environment node

import BaseAPI from '@/modules/User/features/Auth/repositories/base-api';
import { ApiErrorCodes } from '@/modules/User/types/api-errors';
import { HttpError } from '@/services/https-client/http-error';

class TestableBaseAPI extends BaseAPI {
  public callHandleApiError(
    error: unknown,
    context: string
  ): ReturnType<BaseAPI['handleApiError']> {
    return this.handleApiError(error, context);
  }
}

const api = new TestableBaseAPI();

function httpError(status: number, message = 'error'): HttpError {
  return new HttpError({ status, message });
}

describe('BaseAPI.handleApiError', () => {
  describe('HttpError cases', () => {
    it('returns a NETWORK error for status 0', () => {
      const result = api.callHandleApiError(httpError(0), 'Test');

      expect(result.code).toBe(ApiErrorCodes.NETWORK);
      expect(result.message).toBe('Network error. Please check your connection.');
    });

    it('returns a NETWORK error when the message contains "failed to fetch"', () => {
      const result = api.callHandleApiError(httpError(200, 'Failed to fetch'), 'Test');

      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('returns a VALIDATION error for HTTP 400', () => {
      const result = api.callHandleApiError(httpError(400), 'Login');

      expect(result.code).toBe(ApiErrorCodes.VALIDATION);
      expect(result.message).toBe('Invalid login data');
    });

    it('returns an AUTH error for HTTP 401', () => {
      const result = api.callHandleApiError(httpError(401), 'Login');

      expect(result.code).toBe(ApiErrorCodes.AUTH);
    });

    it('returns a FORBIDDEN error for HTTP 403', () => {
      const result = api.callHandleApiError(httpError(403), 'Login');

      expect(result.code).toBe(ApiErrorCodes.FORBIDDEN);
    });

    it('returns a NOT_FOUND error for HTTP 404', () => {
      const result = api.callHandleApiError(httpError(404), 'Login');

      expect(result.code).toBe(ApiErrorCodes.NOT_FOUND);
      expect(result.message).toBe('Login not found');
    });

    it('returns a TIMEOUT error for HTTP 408', () => {
      const result = api.callHandleApiError(httpError(408), 'Login');

      expect(result.code).toBe(ApiErrorCodes.TIMEOUT);
    });

    it('returns a VALIDATION error for HTTP 422', () => {
      const result = api.callHandleApiError(httpError(422), 'Registration');

      expect(result.code).toBe(ApiErrorCodes.VALIDATION);
      expect(result.message).toBe('Unprocessable registration data');
    });

    it('returns a RATE_LIMITED error for HTTP 429', () => {
      const result = api.callHandleApiError(httpError(429), 'Login');

      expect(result.code).toBe(ApiErrorCodes.RATE_LIMITED);
    });

    it('returns a CONFLICT error for HTTP 409', () => {
      const result = api.callHandleApiError(httpError(409), 'Registration');

      expect(result.code).toBe(ApiErrorCodes.CONFLICT);
    });

    it.each([502, 503, 504])('returns a SERVER error for HTTP %d', (status) => {
      const result = api.callHandleApiError(httpError(status), 'Login');

      expect(result.code).toBe(ApiErrorCodes.SERVER);
      expect(result.status).toBe(status);
    });

    it('returns a SERVER error for HTTP 500', () => {
      const result = api.callHandleApiError(httpError(500), 'Login');

      expect(result.code).toBe(ApiErrorCodes.SERVER);
      expect(result.status).toBe(500);
    });

    it('returns an UNKNOWN error for unrecognised HTTP status', () => {
      const result = api.callHandleApiError(httpError(418), 'Login');

      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });

  describe('Non-HttpError cases', () => {
    it('returns a CANCELLED error for an AbortError', () => {
      const abortError = new Error('Request was aborted');
      abortError.name = 'AbortError';

      const result = api.callHandleApiError(abortError, 'Login');

      expect(result.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('returns a NETWORK error for a plain network Error', () => {
      const result = api.callHandleApiError(new Error('Failed to fetch'), 'Login');

      expect(result.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('returns an UNKNOWN error for an Error with malformed abort metadata', () => {
      const malformedError = new Error('Request failed') as Error & {
        name: { toLowerCase?: () => string };
        message: { toLowerCase?: () => string };
      };

      Object.defineProperty(malformedError, 'name', {
        value: {},
        configurable: true,
      });
      Object.defineProperty(malformedError, 'message', {
        value: {},
        configurable: true,
      });

      const result = api.callHandleApiError(malformedError, 'Login');

      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(result.message).toBe('Login failed. Please try again.');
    });

    it('returns an UNKNOWN error for an Error with missing abort metadata', () => {
      const missingMetadataError = new Error('Request failed') as Error & {
        name?: string;
        message?: string;
      };

      Object.defineProperty(missingMetadataError, 'name', {
        value: undefined,
        configurable: true,
      });
      Object.defineProperty(missingMetadataError, 'message', {
        value: undefined,
        configurable: true,
      });

      const result = api.callHandleApiError(missingMetadataError, 'Login');

      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(result.message).toBe('Login failed. Please try again.');
    });

    it('returns an UNKNOWN error for an Error with an empty message', () => {
      const result = api.callHandleApiError(new Error(''), 'Login');

      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    });

    it('returns an UNKNOWN error for an unknown non-Error value', () => {
      const result = api.callHandleApiError('something unexpected', 'Login');

      expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(result.message).toBe('Login failed. Please try again.');
    });
  });
});
