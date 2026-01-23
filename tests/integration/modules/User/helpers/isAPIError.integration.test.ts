import '../../../setup';
import { isAPIError as isAPIErrorFromBarrel } from '@/modules/User/features/Auth/api';
import isAPIError from '@/modules/User/helpers/isAPIError';

describe('isAPIError Integration Tests', () => {
  describe('barrel export', () => {
    it('should be accessible via Auth API barrel export', () => {
      expect(isAPIErrorFromBarrel).toBe(isAPIError);
      expect(isAPIErrorFromBarrel({ code: 'TEST', message: 'test' })).toBe(true);
    });
  });

  describe('valid API errors', () => {
    it('should return true for objects with code and message strings', () => {
      const validError = { code: 'VALIDATION_ERROR', message: 'Invalid input' };
      expect(isAPIError(validError)).toBe(true);
    });

    it('should return true for API error with additional properties', () => {
      const errorWithExtras = {
        code: 'AUTH_ERROR',
        message: 'Unauthorized',
        details: { field: 'email' },
      };
      expect(isAPIError(errorWithExtras)).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should return false for null', () => {
      expect(isAPIError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isAPIError(undefined)).toBe(false);
    });

    it('should return false for primitive string', () => {
      expect(isAPIError('error message')).toBe(false);
    });

    it('should return false for primitive number', () => {
      expect(isAPIError(500)).toBe(false);
    });

    it('should return false for object missing code property', () => {
      expect(isAPIError({ message: 'Error occurred' })).toBe(false);
    });

    it('should return false for object missing message property', () => {
      expect(isAPIError({ code: 'ERROR' })).toBe(false);
    });

    it('should return false when code is not a string', () => {
      expect(isAPIError({ code: 500, message: 'Server error' })).toBe(false);
    });

    it('should return false when message is not a string', () => {
      expect(isAPIError({ code: 'ERROR', message: 123 })).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isAPIError({})).toBe(false);
    });

    it('should return false for array', () => {
      expect(isAPIError(['code', 'message'])).toBe(false);
    });
  });
});
