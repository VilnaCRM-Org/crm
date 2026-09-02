import type { AppConfigReader } from '@/config/runtime/types/app-config';
import { buildAppConfigReader, buildHttpUrl } from '@tests/builders';

describe('getGraphQLUrl', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  const resolveUrl = async (
    appConfig: AppConfigReader = buildAppConfigReader()
  ): Promise<string> => {
    const { default: GraphQLUrl } = await import('@/utils/get-graphql-url');
    return new GraphQLUrl(appConfig).resolve();
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
      /A GraphQL URL must be defined in production environment/
    );
  });

  it('names both configuration keys and the localhost refusal when it throws', async () => {
    delete process.env.REACT_APP_GRAPHQL_URL;
    process.env.NODE_ENV = 'production';

    await expect(resolveUrl()).rejects.toThrow(
      'A GraphQL URL must be defined in production environment. Set graphqlUrl in the runtime ' +
        'configuration (APP_CONFIG_GRAPHQL_URL) or REACT_APP_GRAPHQL_URL at build time. ' +
        'Cannot default to localhost.'
    );
  });

  it('throws in production when the url is whitespace-only', async () => {
    process.env.REACT_APP_GRAPHQL_URL = '   ';
    process.env.NODE_ENV = 'production';

    await expect(resolveUrl()).rejects.toThrow(
      /A GraphQL URL must be defined in production environment/
    );
  });

  describe('runtime configuration (issue #145)', () => {
    it('prefers the injected runtime url over the build-time one', async () => {
      const runtimeUrl = buildHttpUrl('/graphql');
      process.env.REACT_APP_GRAPHQL_URL = 'http://build-time.example.com/graphql';

      await expect(resolveUrl(buildAppConfigReader({ graphqlUrl: runtimeUrl }))).resolves.toBe(
        runtimeUrl
      );
    });

    it('satisfies the production requirement from the runtime url alone', async () => {
      const runtimeUrl = buildHttpUrl('/graphql');
      delete process.env.REACT_APP_GRAPHQL_URL;
      process.env.NODE_ENV = 'production';

      await expect(resolveUrl(buildAppConfigReader({ graphqlUrl: runtimeUrl }))).resolves.toBe(
        runtimeUrl
      );
    });

    it('uses the injected reader rather than the module singleton', async () => {
      const runtimeUrl = buildHttpUrl('/graphql');
      const appConfig = buildAppConfigReader({ graphqlUrl: runtimeUrl });
      const graphqlUrl = jest.spyOn(appConfig, 'graphqlUrl');

      await expect(resolveUrl(appConfig)).resolves.toBe(runtimeUrl);
      expect(graphqlUrl).toHaveBeenCalledTimes(1);
    });
  });
});
