import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLFormattedError } from 'graphql';

import { formatError } from '../../docker/apollo-server/lib/formatError';

describe('formatError', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  describe('INTERNAL_SERVER_ERROR', () => {
    it('should format internal server error in production', () => {
      process.env.NODE_ENV = 'production';

      const formattedError: GraphQLFormattedError = {
        message: 'Original error message',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = new Error('Detailed error message');
      const result = formatError(formattedError, error);

      expect(result).toEqual({
        message: 'Something went wrong on the server. Please try again later.',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      });
      expect(result).not.toHaveProperty('details');
    });

    it('should include details in development for internal server error', () => {
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      const { formatError: formatErrorDev } = require('../../docker/apollo-server/lib/formatError');

      const formattedError: GraphQLFormattedError = {
        message: 'Original error message',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = new Error('Detailed error message');
      const result = formatErrorDev(formattedError, error);

      expect(result).toEqual({
        message: 'Something went wrong on the server. Please try again later.',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
        details: 'Detailed error message',
      });
    });
  });

  describe('BAD_REQUEST', () => {
    it('should format bad request error in production', () => {
      process.env.NODE_ENV = 'production';

      const formattedError: GraphQLFormattedError = {
        message: 'Original error message',
        extensions: {
          code: 'BAD_REQUEST',
        },
      };

      const error = new Error('Validation failed');
      const result = formatError(formattedError, error);

      expect(result).toEqual({
        message: 'The request was invalid. Please check your input.',
        extensions: {
          code: 'BAD_REQUEST',
        },
      });
      expect(result).not.toHaveProperty('details');
    });

    it('should include details in development for bad request', () => {
      process.env.NODE_ENV = 'development';

      // Re-import to pick up new NODE_ENV
      jest.resetModules();
      const { formatError: formatErrorDev } = require('../../docker/apollo-server/lib/formatError');

      const formattedError: GraphQLFormattedError = {
        message: 'Original error message',
        extensions: {
          code: 'BAD_REQUEST',
        },
      };

      const error = new Error('Validation failed');
      const result = formatErrorDev(formattedError, error);

      expect(result).toEqual({
        message: 'The request was invalid. Please check your input.',
        extensions: {
          code: 'BAD_REQUEST',
        },
        details: 'Validation failed',
      });
    });
  });

  describe('GRAPHQL_VALIDATION_FAILED', () => {
    it('should format GraphQL validation error', () => {
      process.env.NODE_ENV = 'production';

      const formattedError: GraphQLFormattedError = {
        message: 'Original validation error',
        extensions: {
          code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
        },
      };

      const error = new Error('Query validation failed');
      const result = formatError(formattedError, error);

      expect(result).toEqual({
        message: "Your query doesn't match the schema. Please check it!",
        extensions: {
          code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
        },
      });
    });

    it('should not include details for validation error in development', () => {
      process.env.NODE_ENV = 'development';

      const formattedError: GraphQLFormattedError = {
        message: 'Original validation error',
        extensions: {
          code: ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED,
        },
      };

      const error = new Error('Query validation failed');
      const result = formatError(formattedError, error);

      expect(result).not.toHaveProperty('details');
    });
  });

  describe('unknown error codes', () => {
    it('should return original formatted error for unknown code', () => {
      const formattedError: GraphQLFormattedError = {
        message: 'Some other error',
        extensions: {
          code: 'UNKNOWN_ERROR',
        },
      };

      const error = new Error('Unknown error');
      const result = formatError(formattedError, error);

      expect(result).toEqual(formattedError);
    });

    it('should return error without extensions', () => {
      const formattedError: GraphQLFormattedError = {
        message: 'Error without extensions',
      };

      const error = new Error('Error');
      const result = formatError(formattedError, error);

      expect(result).toEqual(formattedError);
    });
  });

  describe('error logging', () => {
    it('should log error to console', () => {
      const formattedError: GraphQLFormattedError = {
        message: 'Test error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = new Error('Error details');
      formatError(formattedError, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('GraphQL Error:', error);
    });
  });

  describe('edge cases', () => {
    it('should handle error without message', () => {
      process.env.NODE_ENV = 'development';

      // Re-import to pick up new NODE_ENV
      jest.resetModules();
      const { formatError: formatErrorDev } = require('../../docker/apollo-server/lib/formatError');

      const formattedError: GraphQLFormattedError = {
        message: '',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = new Error();
      const result = formatErrorDev(formattedError, error);

      expect(result).toHaveProperty('message');
      expect(result.details).toBe('');
    });

    it('should handle non-Error objects', () => {
      process.env.NODE_ENV = 'development';

      const formattedError: GraphQLFormattedError = {
        message: 'Error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = { message: 'Not an Error instance' };
      const result = formatError(formattedError, error);

      expect(result).toHaveProperty('message');
    });

    it('should handle null extensions', () => {
      const formattedError: GraphQLFormattedError = {
        message: 'Error',
      };

      const error = new Error('Test');
      const result = formatError(formattedError, error);

      expect(result).toEqual(formattedError);
    });

    it('should handle undefined extensions code', () => {
      const formattedError: GraphQLFormattedError = {
        message: 'Error',
        extensions: {},
      };

      const error = new Error('Test');
      const result = formatError(formattedError, error);

      expect(result).toEqual(formattedError);
    });

    it('should handle null formattedError', () => {
      const formattedError = null as unknown as GraphQLFormattedError;
      const error = new Error('Test');
      const result = formatError(formattedError, error);

      expect(result).toBeNull();
    });

    it('should handle formattedError with null extensions', () => {
      const formattedError: GraphQLFormattedError = { message: 'Error' };

      const error = new Error('Test');
      const result = formatError(formattedError, error);

      expect(result).toEqual(formattedError);
    });

    it('should handle formattedError with undefined extensions.code', () => {
      const formattedError: GraphQLFormattedError = {
        message: 'Error',
        extensions: { code: undefined },
      };

      const error = new Error('Test');
      const result = formatError(formattedError, error);

      expect(result).toEqual(formattedError);
    });
  });

  describe('environment detection', () => {
    it('should treat undefined NODE_ENV as non-development', () => {
      delete process.env.NODE_ENV;

      const formattedError: GraphQLFormattedError = {
        message: 'Error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = new Error('Details');
      const result = formatError(formattedError, error);

      expect(result).not.toHaveProperty('details');
    });

    it('should treat test environment as non-development', () => {
      process.env.NODE_ENV = 'test';

      const formattedError: GraphQLFormattedError = {
        message: 'Error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
        },
      };

      const error = new Error('Details');
      const result = formatError(formattedError, error);

      expect(result).not.toHaveProperty('details');
    });
  });
});
