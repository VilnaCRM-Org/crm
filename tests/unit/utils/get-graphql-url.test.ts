import GraphQLUrl from '@/utils/get-graphql-url';

describe('getGraphQLUrl', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns the configured url trimmed when provided', () => {
    process.env.REACT_APP_GRAPHQL_URL = ' http://example.com/graphql ';

    expect(new GraphQLUrl().resolve()).toBe('http://example.com/graphql');
  });

  it('falls back to the localhost default outside production', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'test';

    expect(new GraphQLUrl().resolve()).toBe('http://localhost:4000/graphql');
  });

  it('treats a whitespace-only url as missing outside production', () => {
    process.env.REACT_APP_GRAPHQL_URL = '   ';
    process.env.NODE_ENV = 'test';

    expect(new GraphQLUrl().resolve()).toBe('http://localhost:4000/graphql');
  });

  it('throws in production when the url is missing', () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'production';

    expect(() => new GraphQLUrl().resolve()).toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production/
    );
  });

  it('throws in production when the url is whitespace-only', () => {
    process.env.REACT_APP_GRAPHQL_URL = '   ';
    process.env.NODE_ENV = 'production';

    expect(() => new GraphQLUrl().resolve()).toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production/
    );
  });
});
