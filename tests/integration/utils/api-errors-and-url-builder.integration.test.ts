import '../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import buildApiUrl from '@/utils/urlBuilder';
import ApiErrorFactory from '@auth/api/api-error-factory';
import ApiStatusErrorFactory from '@auth/api/api-status-error-factory';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
  ApiErrorCodes,
} from '@auth/api/ApiErrors';

describe('API Errors and URL Builder Integration', () => {
  describe('ApiError Constructors', () => {
    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth error');

      expect(error.message).toBe('Custom auth error');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
    });

    it('should create ConflictError with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });

    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('Custom conflict error');

      expect(error.message).toBe('Custom conflict error');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });

    it('should create ValidationError with default options', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with custom message', () => {
      const error = new ValidationError({ message: 'Custom validation error' });

      expect(error.message).toBe('Custom validation error');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with status 422', () => {
      const error = new ValidationError({
        message: 'Unprocessable entity',
        status: 422,
      });

      expect(error.message).toBe('Unprocessable entity');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(422);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with cause', () => {
      const cause = new Error('Original error');
      const error = new ValidationError({
        message: 'Validation failed',
        cause,
      });

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ValidationError');
    });

    it('should create ValidationError with all options', () => {
      const cause = new Error('Root cause');
      const error = new ValidationError({
        message: 'Complex validation error',
        status: 422,
        cause,
      });

      expect(error.message).toBe('Complex validation error');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(422);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('ApiErrorFactory defensive branches', () => {
    it('maps status-less network HTTP errors by message content', () => {
      expect(
        ApiErrorFactory.fromHttpError(
          { status: undefined as unknown as number, message: 'network unavailable' },
          'Login'
        ).code
      ).toBe(ApiErrorCodes.NETWORK);
    });

    it('keeps the simple status fallback branch covered', () => {
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

    it('uses the registered auth UI error parser when resolved from DI', () => {
      const mapper = container.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper);

      expect(mapper.map(new Error('Network error')).displayMessage).toBeTruthy();
    });

    it('uses an injected auth UI error parser when provided', () => {
      const parser = {
        parseHttpError: jest.fn().mockReturnValue({ code: 'HTTP_401', message: 'Unauthorized' }),
      };
      const mapper = new AuthUiErrorMapper(parser as never);

      expect(mapper.map(new Error('ignored'))).toEqual({
        displayMessage: 'Unauthorized',
        retryable: false,
      });
      expect(parser.parseHttpError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('loads the auth UI mapper when the reflected parser type is unavailable', () => {
      jest.isolateModules(() => {
        jest.doMock('@/utils/error/error-parser', () => ({ __esModule: true, default: undefined }));

        expect(require('@/modules/User/store/auth-ui-error-mapper')).toBeDefined();

        jest.dontMock('@/utils/error/error-parser');
      });
    });

    it('loads auth API modules when reflected constructor types are unavailable', () => {
      for (const modulePath of ['@auth/api/login-api', '@auth/api/registration-api']) {
        jest.isolateModules(() => {
          jest.doMock('@auth/api/api-error-factory', () => ({
            __esModule: true,
            default: undefined,
          }));

          expect(require(modulePath)).toBeDefined();

          jest.dontMock('@auth/api/api-error-factory');
        });
      }
    });
  });

  describe('urlBuilder branch coverage', () => {
    const originalEnv = process.env.REACT_APP_MOCKOON_URL;

    afterEach(() => {
      process.env.REACT_APP_MOCKOON_URL = originalEnv;
    });

    it('should handle when baseUrl exists', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:3001';

      const result = buildApiUrl('/api/users');

      expect(result).toBe('http://localhost:3001/api/users');
    });

    it('should handle when baseUrl exists with trailing slashes', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:3001///';

      const result = buildApiUrl('///api/users');

      expect(result).toBe('http://localhost:3001/api/users');
    });

    it('should handle when baseUrl is empty string', () => {
      process.env.REACT_APP_MOCKOON_URL = '';

      const result = buildApiUrl('/api/users');

      expect(result).toBe('/api/users');
    });

    it('should handle when baseUrl is undefined', () => {
      delete process.env.REACT_APP_MOCKOON_URL;

      const result = buildApiUrl('/api/users');

      expect(result).toBe('/api/users');
    });

    it('should handle when baseUrl is whitespace only', () => {
      process.env.REACT_APP_MOCKOON_URL = '   ';

      const result = buildApiUrl('/api/users');

      expect(result).toBe('/api/users');
    });

    it('should handle endpoint without leading slash when baseUrl exists', () => {
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:3001';

      const result = buildApiUrl('api/users');

      expect(result).toBe('http://localhost:3001/api/users');
    });

    it('should handle endpoint without leading slash when baseUrl is empty', () => {
      process.env.REACT_APP_MOCKOON_URL = '';

      const result = buildApiUrl('api/users');

      expect(result).toBe('/api/users');
    });
  });
});
