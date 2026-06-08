import '../setup';

import GraphQLUrl from '@/utils/get-graphql-url';

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

  it('returns the default localhost url when the env var is not set', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'test';

    expect(GraphQLUrl.resolve()).toBe('http://localhost:4000/graphql');
  });

  it('returns the configured url when provided', () => {
    process.env.REACT_APP_GRAPHQL_URL = 'http://example.com/graphql';

    expect(GraphQLUrl.resolve()).toBe('http://example.com/graphql');
  });

  it('throws in production when the url is missing', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'production';

    expect(() => GraphQLUrl.resolve()).toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production/
    );
  });
});
