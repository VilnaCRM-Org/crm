import '../setup';

import rawEnv from '@/config/env/raw-env';

describe('env config Integration', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('parses the environment and exposes typed config through the barrel', async () => {
    process.env.REACT_APP_GRAPHQL_URL = 'https://api.example.com/graphql';
    process.env.NODE_ENV = 'production';

    const { env, EnvSchema } = await import('@/config/env');

    expect(env.get().graphqlUrl).toBe('https://api.example.com/graphql');
    expect(env.graphqlUrl()).toBe('https://api.example.com/graphql');
    expect(env.isProduction()).toBe(true);
    expect(EnvSchema.safeParse({}).success).toBe(true);
  });

  it('fails fast with an aggregated error when the environment is malformed', async () => {
    process.env.REACT_APP_GRAPHQL_URL = 'not-a-url';

    await expect(import('@/config/env')).rejects.toThrow(/Invalid environment configuration/);
  });

  it('reads build-inlined variables through rawEnv', () => {
    process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080';
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'seed';

    expect(rawEnv.mockoonUrl()).toBe('http://localhost:8080');
    expect(rawEnv.lhciPreloadedAuthToken()).toBe('seed');
    expect(rawEnv.snapshot().mockoonUrl).toBe('http://localhost:8080');
  });
});
