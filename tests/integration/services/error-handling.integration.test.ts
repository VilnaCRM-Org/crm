import '../setup';
import {
  ApiError,
  AuthenticationError,
  ConflictError,
  ValidationError,
  ApiErrorCodes,
} from '@/modules/user/lib/api-errors';
import { ErrorHandler } from '@/services/error/error-handler';
import ErrorParser from '@/utils/error/error-parser';

const errorHandler = new ErrorHandler();
const errorParser = new ErrorParser();

describe('ApiError classes', () => {
  describe('ApiError', () => {
    it('should create ApiError with all parameters', () => {
      const cause = new Error('Original');
      const error = new ApiError({
        message: 'Test error',
        code: ApiErrorCodes.UNKNOWN,
        status: 500,
        cause,
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(error.status).toBe(500);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without status code and original error', () => {
      const error = new ApiError({ message: 'Test error', code: ApiErrorCodes.NETWORK });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ApiErrorCodes.NETWORK);
      expect(error.status).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('should construct even when captureStackTrace is unavailable', () => {
      const originalCapture = (
        Error as unknown as { captureStackTrace?: typeof Error.captureStackTrace }
      ).captureStackTrace;
      (
        Error as unknown as { captureStackTrace?: typeof Error.captureStackTrace }
      ).captureStackTrace = undefined;

      try {
        const error = new ApiError({
          message: 'No stack capture',
          code: ApiErrorCodes.UNKNOWN,
          status: 400,
        });
        expect(error.code).toBe(ApiErrorCodes.UNKNOWN);
        expect(error.status).toBe(400);
        expect(error.name).toBe('ApiError');
      } finally {
        (
          Error as unknown as { captureStackTrace?: typeof Error.captureStackTrace }
        ).captureStackTrace = originalCapture;
      }
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with default message', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
      expect(error instanceof ApiError).toBe(true);
    });

    it('should create AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Custom auth message');

      expect(error.message).toBe('Custom auth message');
      expect(error.code).toBe(ApiErrorCodes.AUTH);
      expect(error.status).toBe(401);
    });
  });

  describe('ConflictError', () => {
    it('should create ConflictError with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
      expect(error instanceof ApiError).toBe(true);
    });

    it('should create ConflictError with custom message', () => {
      const error = new ConflictError('User already registered');

      expect(error.message).toBe('User already registered');
      expect(error.code).toBe(ApiErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with default values', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Invalid data provided');
      expect(error.code).toBe(ApiErrorCodes.VALIDATION);
      expect(error.status).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error instanceof ApiError).toBe(true);
    });

    it('should create ValidationError with custom message', () => {
      const error = new ValidationError({ message: 'Email is invalid' });

      expect(error.message).toBe('Email is invalid');
      expect(error.status).toBe(400);
    });

    it('should create ValidationError with status 422', () => {
      const error = new ValidationError({
        message: 'Unprocessable entity',
        status: 422,
      });

      expect(error.message).toBe('Unprocessable entity');
      expect(error.status).toBe(422);
    });

    it('should create ValidationError with cause', () => {
      const cause = new Error('Original validation error');
      const error = new ValidationError({
        message: 'Validation failed',
        cause,
      });

      expect(error.message).toBe('Validation failed');
      expect(error.cause).toBe(cause);
    });

    it('should create ValidationError with all options', () => {
      const cause = new Error('Cause');
      const error = new ValidationError({
        message: 'Custom validation',
        status: 422,
        cause,
      });

      expect(error.message).toBe('Custom validation');
      expect(error.status).toBe(422);
      expect(error.cause).toBe(cause);
    });
  });
});

describe('ErrorHandler', () => {
  let logger: { error: jest.Mock };

  beforeEach(() => {
    logger = { error: jest.fn() };
    errorHandler.setLogger(logger);
  });

  afterEach(() => {
    errorHandler.setLogger(undefined);
  });

  it('should handle Error instance', () => {
    const error = new Error('Test error');
    errorHandler.handle(error);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', error);
  });

  it('should handle string error', () => {
    const error = 'String error';
    errorHandler.handle(error);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', error);
  });

  it('should handle null error', () => {
    errorHandler.handle(null);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', null);
  });

  it('should handle undefined error', () => {
    errorHandler.handle(undefined);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', undefined);
  });

  it('should handle object error', () => {
    const error = { message: 'Object error', code: 123 };
    errorHandler.handle(error);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', error);
  });

  it('should handle ApiError', () => {
    const error = new ApiError({ message: 'API error', code: ApiErrorCodes.SERVER, status: 500 });
    errorHandler.handle(error);

    expect(logger.error).toHaveBeenCalledWith('[ErrorHandler]', error);
  });
});

describe('ErrorParser', () => {
  it('should parse ApiError with parseHttpError', () => {
    const error = new ApiError({ message: 'API error', code: ApiErrorCodes.AUTH, status: 401 });
    const result = errorParser.parseHttpError(error);

    expect(result.code).toBe(ApiErrorCodes.AUTH);
    expect(result.message).toBe('API error');
    expect(result.original).toBe(error);
  });

  it('should parse AuthenticationError with parseHttpError', () => {
    const error = new AuthenticationError();
    const result = errorParser.parseHttpError(error);

    expect(result.code).toBe(ApiErrorCodes.AUTH);
    expect(result.message).toBe('Invalid credentials');
  });

  it('should parse regular Error with parseHttpError', () => {
    const error = new Error('Test error message');
    const result = errorParser.parseHttpError(error);

    expect(result.code).toBe('JS_ERROR');
    expect(result.message).toBe('Test error message');
    expect(result.original).toBe(error);
  });

  it('should parse unknown error types', () => {
    const error = 'String error';
    const result = errorParser.parseHttpError(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBe(error);
  });

  it('should parse null', () => {
    const result = errorParser.parseHttpError(null);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBeNull();
  });

  it('should parse undefined', () => {
    const result = errorParser.parseHttpError(undefined);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBeUndefined();
  });

  it('should parse number', () => {
    const result = errorParser.parseHttpError(123);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBe(123);
  });

  it('should parse object', () => {
    const error = { code: 123, detail: 'Some detail' };
    const result = errorParser.parseHttpError(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBe(error);
  });
});
