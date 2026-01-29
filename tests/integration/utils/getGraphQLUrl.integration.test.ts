import '../setup';

import getGraphQLUrl from '@/utils/getGraphQLUrl';

describe('getGraphQLUrl Integration', () => {
  const originalEnv = { ...process.env };
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('returns default localhost url when env is not set', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'test';

    expect(getGraphQLUrl()).toBe('http://localhost:4000/graphql');
  });

  it('returns env url when provided', () => {
    process.env.REACT_APP_GRAPHQL_URL = 'http://example.com/graphql';

    expect(getGraphQLUrl()).toBe('http://example.com/graphql');
  });

  it('throws in production when env url is missing', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'production';

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => getGraphQLUrl()).toThrow(
      'REACT_APP_GRAPHQL_URL must be defined in production environment. Cannot default to localhost.'
    );

    consoleSpy.mockRestore();
  });
});
