describe('getGraphQLUrl', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  const resolveUrl = async (): Promise<string> => {
    const { default: GraphQLUrl } = await import('@/utils/get-graphql-url');
    return new GraphQLUrl().resolve();
  };

  it('returns the configured url trimmed when provided', async () => {
    process.env.REACT_APP_GRAPHQL_URL = ' http://example.com/graphql ';

    await expect(resolveUrl()).resolves.toBe('http://example.com/graphql');
  });

  it('falls back to the localhost default outside production', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'test';

    await expect(resolveUrl()).resolves.toBe('http://localhost:4000/graphql');
  });

  it('treats a whitespace-only url as missing outside production', async () => {
    process.env.REACT_APP_GRAPHQL_URL = '   ';
    process.env.NODE_ENV = 'test';

    await expect(resolveUrl()).resolves.toBe('http://localhost:4000/graphql');
  });

  it('throws in production when the url is missing', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'production';

    await expect(resolveUrl()).rejects.toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production/
    );
  });

  it('throws in production when the url is whitespace-only', async () => {
    process.env.REACT_APP_GRAPHQL_URL = '   ';
    process.env.NODE_ENV = 'production';

    await expect(resolveUrl()).rejects.toThrow(
      /REACT_APP_GRAPHQL_URL must be defined in production/
    );
  });
});
