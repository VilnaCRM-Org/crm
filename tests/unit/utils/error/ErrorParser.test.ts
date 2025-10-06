import ErrorParser from '@/utils/error/ErrorParser';
import ParsedError from '@/utils/error/types';

import MockResponse from './MockResponse';

const originalResponse = global.Response;

beforeAll(() => {
  global.Response = MockResponse as unknown as typeof Response;
});
afterAll(() => {
  global.Response = originalResponse;
});

describe('ErrorParser', () => {
  describe('parseHttpError', () => {
    describe('with Response objects', () => {
      it('should parse HTTP Response with status 404', () => {
        const response = new Response(null, { status: 404 });
        const result: ParsedError = ErrorParser.parseHttpError(response);

        expect(result).toEqual({
          code: 'HTTP_404',
          message: 'HTTP error 404',
          original: response,
        });
      });

      it('should parse HTTP Response with status 500', () => {
        const response = new Response(null, { status: 500 });
        const result: ParsedError = ErrorParser.parseHttpError(response);

        expect(result).toEqual({
          code: 'HTTP_500',
          message: 'HTTP error 500',
          original: response,
        });
      });

      it('should parse HTTP Response with status 401', () => {
        const response = new Response(null, { status: 401 });
        const result: ParsedError = ErrorParser.parseHttpError(response);

        expect(result).toEqual({
          code: 'HTTP_401',
          message: 'HTTP error 401',
          original: response,
        });
      });

      it('should parse HTTP Response with status 403', () => {
        const response = new Response(null, { status: 403 });
        const result: ParsedError = ErrorParser.parseHttpError(response);

        expect(result).toEqual({
          code: 'HTTP_403',
          message: 'HTTP error 403',
          original: response,
        });
      });

      it('should parse HTTP Response with status 400', () => {
        const response = new Response(null, { status: 400 });
        const result: ParsedError = ErrorParser.parseHttpError(response);

        expect(result).toEqual({
          code: 'HTTP_400',
          message: 'HTTP error 400',
          original: response,
        });
      });

      it('should parse HTTP Response with status 200', () => {
        const response = new Response(null, { status: 200 });
        const result: ParsedError = ErrorParser.parseHttpError(response);

        expect(result).toEqual({
          code: 'HTTP_200',
          message: 'HTTP error 200',
          original: response,
        });
      });
    });

    describe('with Error objects', () => {
      it('should parse JavaScript Error', () => {
        const error = new Error('Something went wrong');
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'JS_ERROR',
          message: 'Something went wrong',
          original: error,
        });
      });

      it('should parse TypeError', () => {
        const error = new TypeError('Type error occurred');
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'JS_ERROR',
          message: 'Type error occurred',
          original: error,
        });
      });

      it('should parse ReferenceError', () => {
        const error = new ReferenceError('Variable not defined');
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'JS_ERROR',
          message: 'Variable not defined',
          original: error,
        });
      });

      it('should parse Error with empty message', () => {
        const error = new Error('');
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'JS_ERROR',
          message: '',
          original: error,
        });
      });

      it('should parse custom Error subclass', () => {
        class CustomError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'CustomError';
          }
        }

        const error = new CustomError('Custom error message');
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'JS_ERROR',
          message: 'Custom error message',
          original: error,
        });
      });
    });

    describe('with unknown error types', () => {
      it('should parse string error as unknown', () => {
        const error = 'String error message';
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.message).toBe('An unknown error occurred');
        expect(result.original).toBe(error);
      });

      it('should parse number error', () => {
        const error = 42;
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should parse null error', () => {
        const error = null;
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should parse undefined error', () => {
        const error = undefined;
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should parse object without Error properties', () => {
        const error = { foo: 'bar' };
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should parse array error', () => {
        const error = ['error1', 'error2'];
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should parse boolean error', () => {
        const error = false;
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should parse Symbol error', () => {
        const error = Symbol('error');
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should return UNKNOWN_ERROR code for non-Response non-Error types', () => {
        const plainObject = { data: 'test' };
        const result = ErrorParser.parseHttpError(plainObject);

        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.message).toBe('An unknown error occurred');
        expect(result.original).toBe(plainObject);
      });

      it('should handle all unknown error return properties', () => {
        const unknownError = 'some string';
        const result = ErrorParser.parseHttpError(unknownError);

        expect(result).toHaveProperty('code', 'UNKNOWN_ERROR');
        expect(result).toHaveProperty('message', 'An unknown error occurred');
        expect(result).toHaveProperty('original', unknownError);
      });

      it('should construct unknown error object with all required fields', () => {
        const plainValue = 123;
        const parsed = ErrorParser.parseHttpError(plainValue);

        const expectedResult: ParsedError = {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: plainValue,
        };

        expect(parsed).toMatchObject(expectedResult);
        expect(parsed.code).toStrictEqual('UNKNOWN_ERROR');
        expect(parsed.message).toStrictEqual('An unknown error occurred');
        expect(parsed.original).toStrictEqual(plainValue);
      });
    });

    describe('edge cases', () => {
      it('should handle object with message but not Error instance', () => {
        const error = { message: 'Not an error object' };
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });

      it('should handle empty object', () => {
        const error = {};
        const result: ParsedError = ErrorParser.parseHttpError(error);

        expect(result).toEqual({
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          original: error,
        });
      });
    });
  });
});
