import { ApiErrorCodes } from '@/modules/user/types/api-errors';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import ApiErrorFactory from '@auth/repositories/api-error-factory';
import ApiStatusErrorFactory from '@auth/repositories/api-status-error-factory';

const makeFactory = (): ApiErrorFactory =>
  new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard());

describe('ApiErrorFactory', () => {
  it('loads auth API modules when reflected constructor types are unavailable', () => {
    const modulePaths = ['@auth/repositories/login-api', '@auth/repositories/registration-api'];
    for (const modulePath of modulePaths) {
      jest.isolateModules(() => {
        jest.doMock('@auth/repositories/api-error-factory', () => ({
          __esModule: true,
          default: undefined,
        }));

        expect(require(modulePath)).toBeDefined();

        jest.dontMock('@auth/repositories/api-error-factory');
      });
    }
  });

  describe('convert — HttpError path', () => {
    it.each([
      [408, 'Network timeout while waiting for response', ApiErrorCodes.TIMEOUT],
      [504, 'Network gateway timeout', ApiErrorCodes.SERVICE_UNAVAILABLE],
    ])('prefers HTTP %i status mapping over network keyword matching', (status, message, code) => {
      const httpError = new HttpError({ status, message });

      const apiError = makeFactory().convert(httpError, 'Login');

      expect(apiError.code).toBe(code);
      expect(apiError.cause).toBe(httpError);
    });

    it('maps cancellation-style HTTP failures to the cancelled code', () => {
      const httpError = new HttpError({ status: 499, message: 'Request aborted by client' });

      const apiError = makeFactory().convert(httpError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(httpError);
    });

    it('maps zero-status network failures by message content', () => {
      const apiError = makeFactory().convert(
        new HttpError({ status: 0, message: 'network unavailable' }),
        'Login'
      );

      expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
      expect(apiError.message).toBe('Network error. Please check your connection.');
    });

    it('maps falsy-status network failures by message content', () => {
      const apiError = makeFactory().convert(
        new HttpError({ status: undefined as unknown as number, message: 'connection lost' }),
        'Login'
      );

      expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('maps unmapped HTTP statuses to the unknown code', () => {
      const apiError = makeFactory().convert(
        new HttpError({ status: 418, message: 'plain failure' }),
        'Login'
      );

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });

  describe('convert — generic Error path', () => {
    it('preserves the original error as cause for unknown generic errors', () => {
      const originalError = new Error('Unexpected failure');

      const apiError = makeFactory().convert(originalError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed. Please try again.');
      expect(apiError.cause).toBe(originalError);
    });

    it('maps AbortError instances to the cancelled code', () => {
      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });

      const apiError = makeFactory().convert(abortError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(abortError);
    });

    it('maps cancellation messages even when the error name is unavailable', () => {
      const cancelled = Object.assign(new Error('aborted'), { name: undefined });

      const apiError = makeFactory().convert(cancelled, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('maps CORS-style messages to the network code', () => {
      const apiError = makeFactory().convert(new Error('cors failure'), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('maps empty generic errors to the unknown code', () => {
      const apiError = makeFactory().convert(new Error(''), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });

  describe('convert — unknown values path', () => {
    it('converts HttpError instances via the HTTP factory path', () => {
      const converted = makeFactory().convert(
        new HttpError({ status: 401, message: 'Unauthorized' }),
        'Login'
      );

      expect(converted.code).toBe(ApiErrorCodes.AUTH);
      expect(converted.message).toBe('Invalid credentials');
    });

    it('converts unknown values via the unknown factory path', () => {
      const converted = makeFactory().convert('unexpected-value', 'Login');

      expect(converted.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(converted.message).toBe('Login failed. Please try again.');
    });
  });
});
