import ApiErrorFactory from '@/modules/User/features/Auth/api/api-error-factory';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';

describe('ApiErrorFactory', () => {
  describe('fromGenericError', () => {
    it('preserves the original error as cause for unknown generic errors', () => {
      const originalError = new Error('Unexpected failure');

      const apiError = ApiErrorFactory.fromGenericError(originalError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed. Please try again.');
      expect(apiError.cause).toBe(originalError);
    });
  });
});
