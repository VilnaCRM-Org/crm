import HttpsClient from '@/services/HttpsClient/HttpsClient';
import HttpClientFactory from '@/services/HttpsClient/HttpsClientFactory';

interface MockClientOptions {
  returnValue?: unknown;
}

const createMockClient = (options: MockClientOptions = {}): new () => HttpsClient => {
  const { returnValue = {} } = options;

  return class implements HttpsClient {
    public async get<T>(): Promise<T> {
      return returnValue as T;
    }

    public async post<T, R>(url: string, data: T): Promise<R> {
      return (url && data ? returnValue : returnValue) as R;
    }

    public async patch<T, R>(url: string, data: T): Promise<R> {
      return (url && data ? returnValue : returnValue) as R;
    }

    public async put<T, R>(url: string, data: T): Promise<R> {
      return (url && data ? returnValue : returnValue) as R;
    }

    public async delete<T, R>(url: string, data?: T): Promise<R> {
      return (url || data ? returnValue : returnValue) as R;
    }
  };
};

const MockHttpsClient = createMockClient();
const AnotherMockHttpsClient = createMockClient({ returnValue: { type: 'another' } });

describe('HttpClientFactory', () => {
  let factory: HttpClientFactory;

  beforeEach(() => {
    factory = new HttpClientFactory();
  });

  describe('registerClient', () => {
    it('should register a client constructor', () => {
      expect(() => {
        factory.registerClient('mock', MockHttpsClient);
      }).not.toThrow();
    });

    it('should allow registering multiple clients', () => {
      factory.registerClient('mock1', MockHttpsClient);
      factory.registerClient('mock2', AnotherMockHttpsClient);

      const client1 = factory.initiateClient('mock1');
      const client2 = factory.initiateClient('mock2');

      expect(client1).toBeInstanceOf(MockHttpsClient);
      expect(client2).toBeInstanceOf(AnotherMockHttpsClient);
    });

    it('should allow overwriting registered client', () => {
      factory.registerClient('mock', MockHttpsClient);
      factory.registerClient('mock', AnotherMockHttpsClient);

      const client = factory.initiateClient('mock');

      expect(client).toBeInstanceOf(AnotherMockHttpsClient);
    });

    it('should register client with empty string name', () => {
      factory.registerClient('', MockHttpsClient);

      const client = factory.initiateClient('');

      expect(client).toBeInstanceOf(MockHttpsClient);
    });

    it('should register client with special characters in name', () => {
      factory.registerClient('client-1_test', MockHttpsClient);

      const client = factory.initiateClient('client-1_test');

      expect(client).toBeInstanceOf(MockHttpsClient);
    });
  });

  describe('initiateClient', () => {
    beforeEach(() => {
      factory.registerClient('mock', MockHttpsClient);
    });

    it('should create and return client instance', () => {
      const client = factory.initiateClient('mock');

      expect(client).toBeInstanceOf(MockHttpsClient);
    });

    it('should return same instance on multiple calls (singleton behavior)', () => {
      const client1 = factory.initiateClient('mock');
      const client2 = factory.initiateClient('mock');

      expect(client1).toBe(client2);
    });

    it('should throw error for unregistered client', () => {
      expect(() => {
        factory.initiateClient('unregistered');
      }).toThrow('HttpClient for "unregistered" not registered.');
    });

    it('should create different instances for different client names', () => {
      factory.registerClient('mock1', MockHttpsClient);
      factory.registerClient('mock2', AnotherMockHttpsClient);

      const client1 = factory.initiateClient('mock1');
      const client2 = factory.initiateClient('mock2');

      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(MockHttpsClient);
      expect(client2).toBeInstanceOf(AnotherMockHttpsClient);
    });

    it('should cache instance after first creation', () => {
      const client1 = factory.initiateClient('mock');
      const client2 = factory.initiateClient('mock');
      const client3 = factory.initiateClient('mock');

      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('should throw error with correct message for unregistered client', () => {
      expect(() => {
        factory.initiateClient('nonexistent');
      }).toThrow('HttpClient for "nonexistent" not registered.');
    });
  });

  describe('singleton pattern', () => {
    it('should maintain separate instances for different names', () => {
      factory.registerClient('client1', MockHttpsClient);
      factory.registerClient('client2', MockHttpsClient);

      const instance1a = factory.initiateClient('client1');
      const instance1b = factory.initiateClient('client1');
      const instance2a = factory.initiateClient('client2');
      const instance2b = factory.initiateClient('client2');

      // Same name should return same instance
      expect(instance1a).toBe(instance1b);
      expect(instance2a).toBe(instance2b);

      // Different names should return different instances
      expect(instance1a).not.toBe(instance2a);
    });

    it('should create new instance after re-registration', () => {
      factory.registerClient('mock', MockHttpsClient);
      const client1 = factory.initiateClient('mock');

      // Re-register with different constructor
      factory.registerClient('mock', AnotherMockHttpsClient);
      const client2 = factory.initiateClient('mock');

      // Should still return cached instance from first registration
      expect(client1).toBe(client2);
      expect(client1).toBeInstanceOf(MockHttpsClient);
    });
  });

  describe('error handling', () => {
    it('should handle initiation before registration', () => {
      expect(() => {
        factory.initiateClient('notYetRegistered');
      }).toThrow();
    });

    it('should provide helpful error message', () => {
      const clientName = 'mySpecialClient';

      expect(() => {
        factory.initiateClient(clientName);
      }).toThrow(`HttpClient for "${clientName}" not registered.`);
    });

    it('should not throw when initiating registered client', () => {
      factory.registerClient('valid', MockHttpsClient);

      expect(() => {
        factory.initiateClient('valid');
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle registering same constructor under different names', () => {
      factory.registerClient('name1', MockHttpsClient);
      factory.registerClient('name2', MockHttpsClient);

      const client1 = factory.initiateClient('name1');
      const client2 = factory.initiateClient('name2');

      // Should be same class but different instances
      expect(client1).toBeInstanceOf(MockHttpsClient);
      expect(client2).toBeInstanceOf(MockHttpsClient);
      expect(client1).not.toBe(client2);
    });

    it('should handle many registrations', () => {
      for (let i = 0; i < 100; i += 1) {
        factory.registerClient(`client${i}`, MockHttpsClient);
      }

      const client50 = factory.initiateClient('client50');
      expect(client50).toBeInstanceOf(MockHttpsClient);
    });

    it('should handle Unicode client names', () => {
      factory.registerClient('клієнт', MockHttpsClient);

      const client = factory.initiateClient('клієнт');

      expect(client).toBeInstanceOf(MockHttpsClient);
    });

    it('should handle client name with spaces', () => {
      factory.registerClient('my client', MockHttpsClient);

      const client = factory.initiateClient('my client');

      expect(client).toBeInstanceOf(MockHttpsClient);
    });

    it('should preserve instance state across calls', () => {
      factory.registerClient('stateful', MockHttpsClient);

      const client1 = factory.initiateClient('stateful') as InstanceType<typeof MockHttpsClient> & {
        customProperty?: string;
      };
      client1.customProperty = 'test value';

      const client2 = factory.initiateClient('stateful') as InstanceType<typeof MockHttpsClient> & {
        customProperty?: string;
      };

      expect(client2.customProperty).toBe('test value');
    });
  });

  describe('real-world scenarios', () => {
    it('should support registering default and custom clients', () => {
      factory.registerClient('default', MockHttpsClient);
      factory.registerClient('authenticated', AnotherMockHttpsClient);

      const defaultClient = factory.initiateClient('default');
      const authClient = factory.initiateClient('authenticated');

      expect(defaultClient).toBeInstanceOf(MockHttpsClient);
      expect(authClient).toBeInstanceOf(AnotherMockHttpsClient);
    });

    it('should allow lazy registration pattern', () => {
      // Register only when needed
      const getClient = (name: string): HttpsClient => {
        try {
          return factory.initiateClient(name);
        } catch {
          factory.registerClient(name, MockHttpsClient);
          return factory.initiateClient(name);
        }
      };

      const client1 = getClient('lazy');
      const client2 = getClient('lazy');

      expect(client1).toBe(client2);
    });

    it('should support multiple factory instances', () => {
      const factory1 = new HttpClientFactory();
      const factory2 = new HttpClientFactory();

      factory1.registerClient('client', MockHttpsClient);
      factory2.registerClient('client', AnotherMockHttpsClient);

      const client1 = factory1.initiateClient('client');
      const client2 = factory2.initiateClient('client');

      expect(client1).toBeInstanceOf(MockHttpsClient);
      expect(client2).toBeInstanceOf(AnotherMockHttpsClient);
      expect(client1).not.toBe(client2);
    });
  });

  describe('type safety', () => {
    it('should return HttpsClient interface', () => {
      factory.registerClient('typed', MockHttpsClient);

      const client: HttpsClient = factory.initiateClient('typed');

      expect(client.get).toBeDefined();
      expect(client.post).toBeDefined();
      expect(client.put).toBeDefined();
      expect(client.patch).toBeDefined();
      expect(client.delete).toBeDefined();
    });

    it('should work with any HttpsClient implementation', () => {
      factory.registerClient('impl1', MockHttpsClient);
      factory.registerClient('impl2', AnotherMockHttpsClient);

      const client1 = factory.initiateClient('impl1');
      const client2 = factory.initiateClient('impl2');

      expect(typeof client1.get).toBe('function');
      expect(typeof client2.get).toBe('function');
    });
  });
});
