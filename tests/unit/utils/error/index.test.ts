import { ErrorParser, ParsedError } from '@/utils/error';
import ErrorParserClass from '@/utils/error/ErrorParser';

import MockResponse from './MockResponse';

global.Response = MockResponse as unknown as typeof Response;

describe('error module exports', () => {
  describe('ErrorParser export', () => {
    it('should export ErrorParser class', () => {
      expect(ErrorParser).toBeDefined();
      expect(typeof ErrorParser).toBe('function');
    });

    it('should be the same as the default export from ErrorParser module', () => {
      expect(ErrorParser).toBe(ErrorParserClass);
    });

    it('should have parseHttpError static method', () => {
      expect(ErrorParser.parseHttpError).toBeDefined();
      expect(typeof ErrorParser.parseHttpError).toBe('function');
    });

    it('should allow calling parseHttpError', () => {
      const error = new Error('Test error');
      const result = ErrorParser.parseHttpError(error);

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('original');
    });
  });

  describe('ParsedError type export', () => {
    it('should allow using ParsedError type', () => {
      const parsedError: ParsedError = {
        code: 'TEST_CODE',
        message: 'Test message',
        original: new Error('Original error'),
      };

      expect(parsedError.code).toBe('TEST_CODE');
      expect(parsedError.message).toBe('Test message');
      expect(parsedError.original).toBeInstanceOf(Error);
    });

    it('should allow ParsedError without original property', () => {
      const parsedError: ParsedError = {
        code: 'TEST_CODE',
        message: 'Test message',
      };

      expect(parsedError.code).toBe('TEST_CODE');
      expect(parsedError.message).toBe('Test message');
      expect(parsedError.original).toBeUndefined();
    });
  });

  describe('integration', () => {
    it('should work together - parse error and type result', () => {
      const error = new Response(null, { status: 404 });
      const result: ParsedError = ErrorParser.parseHttpError(error);

      expect(result.code).toBe('HTTP_404');
      expect(result.message).toBe('HTTP error 404');
      expect(result.original).toBe(error);
    });
  });
});
