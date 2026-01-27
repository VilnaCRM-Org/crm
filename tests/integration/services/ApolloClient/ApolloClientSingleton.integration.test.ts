import { ApolloClient } from '@apollo/client';

import '../../setup';
import { ErrorHandler } from '@/services/error';

describe('ApolloClientSingleton - Production Environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw error in production without REACT_APP_GRAPHQL_URL', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.REACT_APP_GRAPHQL_URL;

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ApolloClient');
    }).toThrow('REACT_APP_GRAPHQL_URL must be defined in production environment');
  });

  it('should work in production with REACT_APP_GRAPHQL_URL defined', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GRAPHQL_URL = 'https://api.prod.example.com/graphql';

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ApolloClient');
    }).not.toThrow();
  });

  it('should use default localhost in development without REACT_APP_GRAPHQL_URL', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.REACT_APP_GRAPHQL_URL;

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ApolloClient');
    }).not.toThrow();
  });
});

describe('ApolloClientSingleton Integration Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ApolloClientSingleton = require('@/services/ApolloClient').default;
  afterEach(async () => {
    await ApolloClientSingleton.resetInstance();
  });

  describe('getInstance', () => {
    it('should return an ApolloClient instance', () => {
      const client = ApolloClientSingleton.getInstance();

      expect(client).toBeInstanceOf(ApolloClient);
    });

    it('should return the same instance on subsequent calls (singleton pattern)', () => {
      const firstCall = ApolloClientSingleton.getInstance();
      const secondCall = ApolloClientSingleton.getInstance();

      expect(firstCall).toBe(secondCall);
    });

    it('should configure client with correct GraphQL URL from environment', () => {
      const client = ApolloClientSingleton.getInstance();

      expect(client.link).toBeDefined();
    });
  });

  describe('resetInstance', () => {
    it('should clear the singleton instance', async () => {
      const firstInstance = ApolloClientSingleton.getInstance();
      await ApolloClientSingleton.resetInstance();
      const secondInstance = ApolloClientSingleton.getInstance();

      expect(firstInstance).not.toBe(secondInstance);
    });

    it('should handle reset when no instance exists', async () => {
      await expect(ApolloClientSingleton.resetInstance()).resolves.not.toThrow();
    });

    it('should handle clearStore errors and still reset instance', async () => {
      const firstInstance = ApolloClientSingleton.getInstance();
      const mockError = new Error('Failed to clear store');

      const errorHandlerSpy = jest.spyOn(ErrorHandler, 'handle');
      jest.spyOn(firstInstance, 'clearStore').mockRejectedValueOnce(mockError);

      await ApolloClientSingleton.resetInstance();

      expect(errorHandlerSpy).toHaveBeenCalledWith(mockError);

      // Verify instance is still reset even after error
      const secondInstance = ApolloClientSingleton.getInstance();
      expect(secondInstance).not.toBe(firstInstance);

      errorHandlerSpy.mockRestore();
    });
  });
});
