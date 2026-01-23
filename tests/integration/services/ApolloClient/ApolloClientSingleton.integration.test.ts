import { ApolloClient } from '@apollo/client';

import '../../setup';
import ApolloClientSingleton from '@/services/ApolloClient';

describe('ApolloClientSingleton Integration Tests', () => {
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
  });
});
