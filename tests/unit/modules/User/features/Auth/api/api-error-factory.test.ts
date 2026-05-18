import ApiErrorFactory from '@/modules/User/features/Auth/api/api-error-factory';
import ApiStatusErrorFactory from '@/modules/User/features/Auth/api/api-status-error-factory';
import { ApiErrorCodes } from '@/modules/User/features/Auth/api/ApiErrors';
import { HttpError } from '@/services/HttpsClient/HttpError';

describe('ApiErrorFactory', () => {
  it('keeps the defensive simple-error fallback branch covered', () => {
    const FactoryCtor = ApiStatusErrorFactory as unknown as new (
      spec: { kind: 'service' },
      error: { status: number; message: string },
      context: string
    ) => object;
    const factory = new FactoryCtor({ kind: 'service' }, { status: 503, message: '' }, 'Login');
    const toSimpleApiError = Reflect.get(factory, 'toSimpleApiError') as (
      kind: 'unexpected'
    ) => unknown;

    expect(toSimpleApiError.call(factory, 'unexpected')).toBe('unexpected');
  });

  it('loads auth API modules when reflected constructor types are unavailable', () => {
    for (const modulePath of [
      '@/modules/User/features/Auth/api/login-api',
      '@/modules/User/features/Auth/api/registration-api',
    ]) {
      jest.isolateModules(() => {
        jest.doMock('@/modules/User/features/Auth/api/api-error-factory', () => ({
          __esModule: true,
          default: undefined,
        }));

        expect(require(modulePath)).toBeDefined();

        jest.dontMock('@/modules/User/features/Auth/api/api-error-factory');
      });
    }
  });

  describe('fromHttpError', () => {
    it.each([
      [408, 'Network timeout while waiting for response', ApiErrorCodes.TIMEOUT],
      [504, 'Network gateway timeout', ApiErrorCodes.SERVICE_UNAVAILABLE],
    ])(
      'prefers HTTP %i status mapping over network keyword matching',
      (status, message, expectedCode) => {
        const httpError = { status, message };

        const apiError = ApiErrorFactory.fromHttpError(httpError, 'Login');

        expect(apiError.code).toBe(expectedCode);
        expect(apiError.cause).toBe(httpError);
      }
    );

    it('maps cancellation-style HTTP failures to the cancelled code', () => {
      const httpError = { status: 499, message: 'Request aborted by client' };

      const apiError = ApiErrorFactory.fromHttpError(httpError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(httpError);
    });

    it('maps status-less network failures by message content', () => {
      const apiError = ApiErrorFactory.fromHttpError(
        { status: undefined as unknown as number, message: 'network unavailable' },
        'Login'
      );

      expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
      expect(apiError.message).toBe('Network error. Please check your connection.');
    });

    it('maps status-less non-network failures to the unknown code', () => {
      const apiError = ApiErrorFactory.fromHttpError(
        { status: undefined as unknown as number, message: 'plain failure' },
        'Login'
      );

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });

  describe('fromGenericError', () => {
    it('preserves the original error as cause for unknown generic errors', () => {
      const originalError = new Error('Unexpected failure');

      const apiError = ApiErrorFactory.fromGenericError(originalError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(apiError.message).toBe('Login failed. Please try again.');
      expect(apiError.cause).toBe(originalError);
    });

    it('maps AbortError instances to the cancelled code', () => {
      const abortError = Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      });

      const apiError = ApiErrorFactory.fromGenericError(abortError, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
      expect(apiError.message).toBe('Request canceled.');
      expect(apiError.cause).toBe(abortError);
    });

    it('maps cancellation messages even when the error name is unavailable', () => {
      const cancelled = Object.assign(new Error('aborted'), { name: undefined });

      const apiError = ApiErrorFactory.fromGenericError(cancelled, 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.CANCELLED);
    });

    it('maps CORS-style messages to the network code', () => {
      const apiError = ApiErrorFactory.fromGenericError(new Error('cors failure'), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.NETWORK);
    });

    it('maps empty generic errors to the unknown code', () => {
      const apiError = ApiErrorFactory.fromGenericError(new Error(''), 'Login');

      expect(apiError.code).toBe(ApiErrorCodes.UNKNOWN);
    });
  });

  describe('convert', () => {
    const factory = new ApiErrorFactory();

    it('converts HttpError instances via the HTTP factory path', () => {
      const converted = factory.convert(
        new HttpError({ status: 401, message: 'Unauthorized' }),
        'Login'
      );

      expect(converted.code).toBe(ApiErrorCodes.AUTH);
      expect(converted.message).toBe('Invalid credentials');
    });

    it('converts generic Error instances via the generic factory path', () => {
      const converted = factory.convert(new Error('Failed to fetch'), 'Login');

      expect(converted.code).toBe(ApiErrorCodes.NETWORK);
      expect(converted.message).toBe('Network error. Please check your connection.');
    });

    it('converts unknown values via the unknown factory path', () => {
      const converted = factory.convert('unexpected-value', 'Login');

      expect(converted.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(converted.message).toBe('Login failed. Please try again.');
    });
  });
});
