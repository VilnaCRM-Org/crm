import ApiStatusErrorFactory from '@/modules/User/features/Auth/api/api-status-error-factory';
import {
  ApiError,
  ApiErrorCodes,
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '@/modules/User/features/Auth/api/ApiErrors';

describe('ApiStatusErrorFactory', () => {
  it.each([
    [400, ValidationError, ApiErrorCodes.VALIDATION, 'Invalid profile data'],
    [401, AuthenticationError, ApiErrorCodes.AUTH, 'Invalid credentials'],
    [403, ApiError, ApiErrorCodes.FORBIDDEN, 'Forbidden'],
    [404, ApiError, ApiErrorCodes.NOT_FOUND, 'Profile not found'],
    [408, ApiError, ApiErrorCodes.TIMEOUT, 'Request timed out. Please try again.'],
    [409, ConflictError, ApiErrorCodes.CONFLICT, 'Profile conflict. Resource already exists.'],
    [422, ValidationError, ApiErrorCodes.VALIDATION, 'Unprocessable profile data'],
    [429, ApiError, ApiErrorCodes.RATE_LIMITED, 'Too many requests. Please slow down.'],
    [500, ApiError, ApiErrorCodes.SERVER, 'Server error. Please try again later.'],
    [
      502,
      ApiError,
      ApiErrorCodes.SERVICE_UNAVAILABLE,
      'Service unavailable. Please try again later.',
    ],
    [
      503,
      ApiError,
      ApiErrorCodes.SERVICE_UNAVAILABLE,
      'Service unavailable. Please try again later.',
    ],
    [
      504,
      ApiError,
      ApiErrorCodes.SERVICE_UNAVAILABLE,
      'Service unavailable. Please try again later.',
    ],
  ])(
    'maps HTTP %i to the expected API error',
    (status, expectedType, expectedCode, expectedMessage) => {
      const httpError = { status, message: `HTTP ${status}` };

      const result = ApiStatusErrorFactory.fromHttpError(httpError, 'Profile');

      expect(result).toBeInstanceOf(expectedType);
      expect(result.code).toBe(expectedCode);
      expect(result.message).toBe(expectedMessage);
    }
  );

  it('preserves status and cause for direct ApiError mappings', () => {
    const httpError = { status: 403, message: 'Forbidden request' };

    const result = ApiStatusErrorFactory.fromHttpError(httpError, 'Profile');

    expect(result.status).toBe(403);
    expect(result.cause).toBe(httpError);
  });

  it('preserves status on validation mappings', () => {
    const result = ApiStatusErrorFactory.fromHttpError(
      { status: 422, message: 'Invalid payload' },
      'Profile'
    );

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.status).toBe(422);
  });

  it.each([400, 422] as const)('preserves the original cause on HTTP %i validation mappings', status => {
    const httpError = { status, message: 'Invalid payload' };

    const result = ApiStatusErrorFactory.fromHttpError(httpError, 'Profile');

    expect(result).toBeInstanceOf(ValidationError);
    expect(result.cause).toBe(httpError);
  });

  it('falls back to an unknown ApiError for unmapped statuses', () => {
    const httpError = { status: 418, message: 'Teapot' };

    const result = ApiStatusErrorFactory.fromHttpError(httpError, 'Profile');

    expect(result).toBeInstanceOf(ApiError);
    expect(result.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(result.message).toBe('Profile failed');
    expect(result.status).toBe(418);
    expect(result.cause).toBe(httpError);
  });
});
