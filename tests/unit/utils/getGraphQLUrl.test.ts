import getGraphQLUrl from '@/utils/get-graphql-url';

describe('getGraphQLUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws in production when REACT_APP_GRAPHQL_URL is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.REACT_APP_GRAPHQL_URL;

    expect(() => getGraphQLUrl()).toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production environment/
    );
  });

  it('returns env URL in production when set', () => {
    process.env.NODE_ENV = 'production';
    process.env.REACT_APP_GRAPHQL_URL = 'https://api.example.com/graphql';

    expect(getGraphQLUrl()).toBe('https://api.example.com/graphql');
  });

  it('returns localhost default outside production when missing', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.REACT_APP_GRAPHQL_URL;

    expect(getGraphQLUrl()).toBe('http://localhost:4000/graphql');
  });
});
