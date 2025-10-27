import '../setup';
import {
  ApiError,
  AuthenticationError,
  ConflictError,
  ValidationError,
  ApiErrorCodes,
} from '@/modules/User/features/Auth/api/ApiErrors';
import { ErrorHandler } from '@/services/error/ErrorHandler';
import ErrorParser from '@/utils/error/ErrorParser';

describe('ApiError classes', () => {
  describe('ApiError', () => {
    it('should create ApiError with all parameters', () => {
      const cause = new Error('Original');
      const error = new ApiError('Test error', ApiErrorCodes.UNKNOWN, 500, cause);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ApiErrorCodes.UNKNOWN);
      expect(error.status).toBe(500);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe('ApiError');
    });

    it('should create ApiError without status code and original error', () => {
      const error = new ApiError('Test error', ApiErrorCodes.NETWORK);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ApiErrorCodes.NETWORK);
      expect(error.status).toBeUndefined();
      expect(error.cause).toBeUndefined();
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
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should handle Error instance', () => {
    const error = new Error('Test error');
    ErrorHandler.handle(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
  });

  it('should handle string error', () => {
    const error = 'String error';
    ErrorHandler.handle(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
  });

  it('should handle null error', () => {
    ErrorHandler.handle(null);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', null);
  });

  it('should handle undefined error', () => {
    ErrorHandler.handle(undefined);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', undefined);
  });

  it('should handle object error', () => {
    const error = { message: 'Object error', code: 123 };
    ErrorHandler.handle(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
  });

  it('should handle ApiError', () => {
    const error = new ApiError('API error', ApiErrorCodes.SERVER, 500);
    ErrorHandler.handle(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('[ErrorHandler]', error);
  });
});

describe('ErrorParser', () => {
  it('should parse ApiError with parseHttpError', () => {
    const error = new ApiError('API error', ApiErrorCodes.AUTH, 401);
    const result = ErrorParser.parseHttpError(error);

    expect(result.code).toBe(ApiErrorCodes.AUTH);
    expect(result.message).toBe('API error');
    expect(result.original).toBe(error);
  });

  it('should parse AuthenticationError with parseHttpError', () => {
    const error = new AuthenticationError();
    const result = ErrorParser.parseHttpError(error);

    expect(result.code).toBe(ApiErrorCodes.AUTH);
    expect(result.message).toBe('Invalid credentials');
  });

  it('should parse regular Error with parseHttpError', () => {
    const error = new Error('Test error message');
    const result = ErrorParser.parseHttpError(error);

    expect(result.code).toBe('JS_ERROR');
    expect(result.message).toBe('Test error message');
    expect(result.original).toBe(error);
  });

  it('should parse unknown error types', () => {
    const error = 'String error';
    const result = ErrorParser.parseHttpError(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBe(error);
  });

  it('should parse null', () => {
    const result = ErrorParser.parseHttpError(null);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBeNull();
  });

  it('should parse undefined', () => {
    const result = ErrorParser.parseHttpError(undefined);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBeUndefined();
  });

  it('should parse number', () => {
    const result = ErrorParser.parseHttpError(123);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBe(123);
  });

  it('should parse object', () => {
    const error = { code: 123, detail: 'Some detail' };
    const result = ErrorParser.parseHttpError(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('An unknown error occurred');
    expect(result.original).toBe(error);
  });
});
