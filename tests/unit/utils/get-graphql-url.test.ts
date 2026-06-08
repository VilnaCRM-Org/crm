import GraphQLUrl from '@/utils/get-graphql-url';

describe('getGraphQLUrl', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns the configured url when provided', () => {
    process.env.REACT_APP_GRAPHQL_URL = 'http://example.com/graphql';

    expect(GraphQLUrl.resolve()).toBe('http://example.com/graphql');
  });

  it('falls back to the localhost default outside production', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'test';

    expect(GraphQLUrl.resolve()).toBe('http://localhost:4000/graphql');
  });

  it('throws in production when the url is missing', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'production';

    expect(() => GraphQLUrl.resolve()).toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production/
    );
  });
});
