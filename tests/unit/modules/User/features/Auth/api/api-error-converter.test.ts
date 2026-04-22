import ApiErrorConverter from '@/modules/User/features/Auth/api/api-error-converter';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';
import { HttpError } from '@/services/HttpsClient/HttpError';

describe('ApiErrorConverter', () => {
  const converter = new ApiErrorConverter();

  it('converts HttpError instances via the HTTP factory path', () => {
    const converted = converter.convert(
      new HttpError({ status: 401, message: 'Unauthorized' }),
      'Login'
    );

    expect(converted.code).toBe(ApiErrorCodes.AUTH);
    expect(converted.message).toBe('Invalid credentials');
  });

  it('converts generic Error instances via the generic factory path', () => {
    const converted = converter.convert(new Error('Failed to fetch'), 'Login');

    expect(converted.code).toBe(ApiErrorCodes.NETWORK);
    expect(converted.message).toBe('Network error. Please check your connection.');
  });

  it('converts unknown values via the unknown factory path', () => {
    const converted = converter.convert('unexpected-value', 'Login');

    expect(converted.code).toBe(ApiErrorCodes.UNKNOWN);
    expect(converted.message).toBe('Login failed. Please try again.');
  });
});
