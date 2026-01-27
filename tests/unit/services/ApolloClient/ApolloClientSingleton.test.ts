import { ErrorHandler } from '@/services/error';

global.fetch = jest.fn();

jest.mock('@/services/error', () => ({
  ErrorHandler: {
    handle: jest.fn(),
  },
}));

describe('ApolloClientSingleton - Production Environment Checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw error in production when REACT_APP_GRAPHQL_URL is not defined', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.REACT_APP_GRAPHQL_URL;

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ApolloClient');
    }).toThrow('REACT_APP_GRAPHQL_URL must be defined in production environment');
  });

  it('should not throw in production when REACT_APP_GRAPHQL_URL is defined', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GRAPHQL_URL = 'https://api.example.com/graphql';

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ApolloClient');
    }).not.toThrow();
  });

  it('should use localhost default in non-production when REACT_APP_GRAPHQL_URL is not defined', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.REACT_APP_GRAPHQL_URL;

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ApolloClient');
    }).not.toThrow();
  });
});

describe('ApolloClientSingleton', () => {
  // Import after environment setup
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ApolloClientSingleton = require('@/services/ApolloClient').default;
  afterEach(async () => {
    await ApolloClientSingleton.resetInstance();
  });

  it('should return the same instance on multiple calls', () => {
    const instance1 = ApolloClientSingleton.getInstance();
    const instance2 = ApolloClientSingleton.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should create a new instance after reset', async () => {
    const instance1 = ApolloClientSingleton.getInstance();
    await ApolloClientSingleton.resetInstance();
    const instance2 = ApolloClientSingleton.getInstance();

    expect(instance1).not.toBe(instance2);
  });

  it('should have a valid Apollo Client with cache', () => {
    const instance = ApolloClientSingleton.getInstance();

    expect(instance.cache).toBeDefined();
    expect(instance.link).toBeDefined();
  });

  it('should handle clearStore errors gracefully', async () => {
    const instance = ApolloClientSingleton.getInstance();
    const mockError = new Error('Clear store failed');

    jest.spyOn(instance, 'clearStore').mockRejectedValueOnce(mockError);

    await ApolloClientSingleton.resetInstance();

    expect(ErrorHandler.handle).toHaveBeenCalledWith(mockError);

    // Verify instance is set to null even after error
    const newInstance = ApolloClientSingleton.getInstance();
    expect(newInstance).not.toBe(instance);
  });
});
