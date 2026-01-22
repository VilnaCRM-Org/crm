import ApolloClientSingleton from '@/services/ApolloClient';

global.fetch = jest.fn();

describe('ApolloClientSingleton', () => {
  afterEach(() => {
    ApolloClientSingleton.resetInstance();
  });

  it('should return the same instance on multiple calls', () => {
    const instance1 = ApolloClientSingleton.getInstance();
    const instance2 = ApolloClientSingleton.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should create a new instance after reset', () => {
    const instance1 = ApolloClientSingleton.getInstance();
    ApolloClientSingleton.resetInstance();
    const instance2 = ApolloClientSingleton.getInstance();

    expect(instance1).not.toBe(instance2);
  });

  it('should have a valid Apollo Client with cache', () => {
    const instance = ApolloClientSingleton.getInstance();

    expect(instance.cache).toBeDefined();
    expect(instance.link).toBeDefined();
  });
});
