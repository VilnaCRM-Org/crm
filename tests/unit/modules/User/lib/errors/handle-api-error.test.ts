import { HttpError } from '@/services/https-client/http-error';

import {
  ApiErrorCodes,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@/modules/user/features/auth/types/api-errors';
import handleApiError from '@/modules/user/lib/errors/handle-api-error';

describe('handleApiError', () => {
  it('maps HttpError status 0 to network error', () => {
    const result = handleApiError(new HttpError({ status: 0, message: 'anything' }), 'Login');
    expect(result.code).toBe(ApiErrorCodes.NETWORK);
  });

  it('maps common HttpError statuses', () => {
    expect(handleApiError(new HttpError({ status: 400, message: 'bad' }), 'Login')).toBeInstanceOf(
      ValidationError
    );
    expect(handleApiError(new HttpError({ status: 401, message: 'unauth' }), 'Login')).toBeInstanceOf(
      AuthenticationError
    );
    expect(handleApiError(new HttpError({ status: 403, message: 'forbidden' }), 'Login').code).toBe(
      ApiErrorCodes.FORBIDDEN
    );
    expect(handleApiError(new HttpError({ status: 404, message: 'not found' }), 'Login').code).toBe(
      ApiErrorCodes.NOT_FOUND
    );
    expect(handleApiError(new HttpError({ status: 408, message: 'timeout' }), 'Login').code).toBe(
      ApiErrorCodes.TIMEOUT
    );
    expect(handleApiError(new HttpError({ status: 429, message: 'rate limited' }), 'Login').code).toBe(
      ApiErrorCodes.RATE_LIMITED
    );
    expect(handleApiError(new HttpError({ status: 409, message: 'conflict' }), 'User')).toBeInstanceOf(
      ConflictError
    );
    expect(handleApiError(new HttpError({ status: 422, message: 'unprocessable' }), 'Login')).toBeInstanceOf(
      ValidationError
    );
  });

  it('maps server and unknown HttpError statuses', () => {
    expect(handleApiError(new HttpError({ status: 500, message: 'server' }), 'Login').code).toBe(
      ApiErrorCodes.SERVER
    );
    expect(handleApiError(new HttpError({ status: 502, message: 'bad gateway' }), 'Login').code).toBe(
      ApiErrorCodes.SERVER
    );
    expect(handleApiError(new HttpError({ status: 503, message: 'unavailable' }), 'Login').code).toBe(
      ApiErrorCodes.SERVER
    );
    expect(handleApiError(new HttpError({ status: 504, message: 'timeout' }), 'Login').code).toBe(
      ApiErrorCodes.SERVER
    );
    expect(handleApiError(new HttpError({ status: 418, message: 'teapot' }), 'Login').code).toBe(
      ApiErrorCodes.UNKNOWN
    );
  });

  it('maps abort and network-like generic errors', () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    expect(handleApiError(abortError, 'Login').code).toBe(ApiErrorCodes.CANCELLED);

    expect(handleApiError(new Error('Failed to fetch'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('fetch failed'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('network down'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('connection reset'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('cors blocked'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('econnreset issue'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('enotfound host'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('econnrefused host'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('enetunreach host'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('ehostunreach host'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('ecanceled host'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('request canceled'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('request cancelled'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
    expect(handleApiError(new Error('err_network'), 'Login').code).toBe(ApiErrorCodes.NETWORK);
  });

  it('falls back to unknown for non-error values', () => {
    expect(handleApiError({} as unknown, 'Login').code).toBe(ApiErrorCodes.UNKNOWN);
  });

  it('handles empty and missing-like generic error fields safely', () => {
    const emptyMessageError = new Error('');
    expect(handleApiError(emptyMessageError, 'Login').code).toBe(ApiErrorCodes.UNKNOWN);

    const malformed = new Error('will be cleared') as Error & {
      name: string | undefined;
      message: string | undefined;
    };
    malformed.name = undefined;
    malformed.message = undefined;

    expect(handleApiError(malformed, 'Login').code).toBe(ApiErrorCodes.UNKNOWN);
  });
});
