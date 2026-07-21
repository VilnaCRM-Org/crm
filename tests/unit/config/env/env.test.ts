describe('env', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('parses, exposes, and freezes a valid environment', async () => {
    process.env.REACT_APP_GRAPHQL_URL = 'https://api.example.com/graphql';
    process.env.NODE_ENV = 'production';

    const { env } = await import('@/config/env');

    expect(env.graphqlUrl()).toBe('https://api.example.com/graphql');
    expect(env.isProduction()).toBe(true);
    expect(env.get().graphqlUrl).toBe('https://api.example.com/graphql');
    expect(Object.isFrozen(env.get())).toBe(true);
  });

  it('treats a non-production environment as not production', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.REACT_APP_GRAPHQL_URL;

    const { env } = await import('@/config/env');

    expect(env.isProduction()).toBe(false);
    expect(env.graphqlUrl()).toBeUndefined();
  });

  it('fails fast with an aggregated error when a variable is malformed', async () => {
    process.env.REACT_APP_GRAPHQL_URL = 'not-a-url';

    await expect(import('@/config/env')).rejects.toThrow(
      /Invalid environment configuration[\s\S]*graphqlUrl/
    );
  });

  it('lists every offending variable in one aggregated error, not just the first', async () => {
    process.env.REACT_APP_GRAPHQL_URL = 'not-a-url';
    process.env.REACT_APP_MOCKOON_URL = 'also-not-a-url';
    process.env.REACT_APP_MAIN_LANGUAGE = 'zz';

    const error = await import('@/config/env').then(
      () => null,
      (thrown: unknown) => thrown as Error
    );

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/graphqlUrl/);
    expect(error?.message).toMatch(/mockoonUrl/);
    expect(error?.message).toMatch(/mainLanguage/);
  });

  it('re-exports the schema through the public barrel', async () => {
    const { EnvSchema } = await import('@/config/env');

    expect(EnvSchema.safeParse({}).success).toBe(true);
    expect(EnvSchema.safeParse({ graphqlUrl: 'not-a-url' }).success).toBe(false);
  });
});
