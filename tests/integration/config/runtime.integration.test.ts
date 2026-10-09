import '../setup';

import type { DependencyContainer } from 'tsyringe';

import type { AppConfig } from '@/config/runtime/app-config';
import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import type { FeatureFlagService } from '@/config/runtime/feature-flag-service';
import type GraphQLUrl from '@/utils/get-graphql-url';
import { buildAppConfigValues, buildFeatureFlagConfig, buildHttpUrl } from '@tests/builders';

const PROBE_FLAG = 'probeFlag';

type RuntimeGraph = {
  container: DependencyContainer;
  tokens: { appConfig: symbol; featureFlagService: symbol; graphQlUrl: symbol };
  singletons: { appConfig: AppConfig; featureFlagService: FeatureFlagService };
};

describe('runtime configuration Integration', () => {
  const ORIGINAL_ENV = { ...process.env };

  const renderRuntimeConfig = (json: string): void => {
    const block = document.createElement('script');
    block.id = APP_CONFIG_ELEMENT_ID;
    block.type = 'application/json';
    block.textContent = json;
    document.head.appendChild(block);
  };

  const loadRuntimeGraph = async (): Promise<RuntimeGraph> => {
    const { default: container } = await import('@/config/dependency-injection-config');
    const { default: RUNTIME_TOKENS } = await import('@/config/runtime/tokens');
    const { default: AUTH_TOKENS } = await import('@/modules/user/config/tokens');
    const { default: appConfig } = await import('@/config/runtime/app-config');
    const { default: featureFlagService } = await import('@/config/runtime/feature-flag-service');

    return {
      container,
      tokens: {
        appConfig: RUNTIME_TOKENS.AppConfig,
        featureFlagService: RUNTIME_TOKENS.FeatureFlagService,
        graphQlUrl: AUTH_TOKENS.GraphQLUrl,
      },
      singletons: { appConfig, featureFlagService },
    };
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    document.getElementById(APP_CONFIG_ELEMENT_ID)?.remove();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
    document.getElementById(APP_CONFIG_ELEMENT_ID)?.remove();
  });

  it('registers the runtime configuration singletons in the real container', async () => {
    const { container, tokens, singletons } = await loadRuntimeGraph();

    expect(container.resolve<AppConfig>(tokens.appConfig)).toBe(singletons.appConfig);
    expect(container.resolve<AppConfig>(tokens.appConfig)).toBe(
      container.resolve<AppConfig>(tokens.appConfig)
    );
    expect(container.resolve<FeatureFlagService>(tokens.featureFlagService)).toBe(
      singletons.featureFlagService
    );
    expect(container.resolve<FeatureFlagService>(tokens.featureFlagService)).toBe(
      container.resolve<FeatureFlagService>(tokens.featureFlagService)
    );
  });

  it('exposes empty configuration and no flags when no block is rendered', async () => {
    const { container, tokens } = await loadRuntimeGraph();
    const { default: appConfigSource } = await import('@/config/runtime/app-config-source');
    const { default: urlBuilder } = await import('@/utils/url-builder');
    const appConfig = container.resolve<AppConfig>(tokens.appConfig);
    const flags = container.resolve<FeatureFlagService>(tokens.featureFlagService);

    expect(appConfigSource.load()).toEqual({});
    expect(appConfig.get()).toEqual(buildAppConfigValues());
    expect(appConfig.apiBaseUrl()).toBeUndefined();
    expect(appConfig.graphqlUrl()).toBeUndefined();
    expect(flags.names()).toEqual([]);
    expect(flags.isEnabled(PROBE_FLAG as never)).toBeUndefined();
    expect(flags.snapshot()).toEqual({});
    expect(urlBuilder.build('/users')).toBe(`${ORIGINAL_ENV.REACT_APP_MOCKOON_URL}/users`);
  });

  it('falls back to an empty configuration outside a DOM host', async () => {
    const { default: appConfigSource } = await import('@/config/runtime/app-config-source');
    const globals = globalThis as { document?: Document };
    const descriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'document'
    ) as PropertyDescriptor;

    delete globals.document;

    try {
      expect(appConfigSource.snapshot()).toEqual({});
    } finally {
      Object.defineProperty(globalThis, 'document', descriptor);
    }
  });

  it('resolves the GraphQL url from the container using the build-time environment', async () => {
    const buildTimeUrl = buildHttpUrl('/graphql');
    process.env.REACT_APP_GRAPHQL_URL = buildTimeUrl;

    const { container, tokens } = await loadRuntimeGraph();

    expect(container.resolve<GraphQLUrl>(tokens.graphQlUrl).resolve()).toBe(buildTimeUrl);
  });

  it('lets a rendered block override the build-time urls', async () => {
    const apiBaseUrl = buildHttpUrl();
    const graphqlUrl = buildHttpUrl('/graphql');
    process.env.REACT_APP_GRAPHQL_URL = buildHttpUrl('/build-time-graphql');
    renderRuntimeConfig(
      JSON.stringify(buildAppConfigValues({ apiBaseUrl, graphqlUrl, flags: {} }))
    );

    const { container, tokens } = await loadRuntimeGraph();
    const { default: urlBuilder } = await import('@/utils/url-builder');
    const appConfig = container.resolve<AppConfig>(tokens.appConfig);

    expect(appConfig.get()).toEqual({ apiBaseUrl, graphqlUrl, flags: {} });
    expect(appConfig.apiBaseUrl()).toBe(apiBaseUrl);
    expect(container.resolve<GraphQLUrl>(tokens.graphQlUrl).resolve()).toBe(graphqlUrl);
    expect(container.resolve<FeatureFlagService>(tokens.featureFlagService).snapshot()).toEqual({});
    expect(urlBuilder.build('/users')).toBe(`${apiBaseUrl}/users`);
  });

  // The paint path reads endpoints before the zod layer loads, so a block that reached the
  // document without passing through the container entrypoint must not hand a non-http(s) value
  // to fetch — url-builder falls back to the build-time origin instead.
  // 'not-a-url' fails to parse at all; 'javascript:alert(1)' parses but carries a scheme no HTTP
  // client can use. Both must be treated as absent rather than handed to fetch.
  it.each(['not-a-url', 'javascript:alert(1)'])(
    'ignores the runtime api base url %s and keeps the build-time origin',
    async (apiBaseUrl) => {
      const buildTimeApi = buildHttpUrl();
      process.env.REACT_APP_MOCKOON_URL = buildTimeApi;
      renderRuntimeConfig(JSON.stringify({ apiBaseUrl }));

      const { default: urlBuilder } = await import('@/utils/url-builder');

      expect(urlBuilder.build('/users')).toBe(`${buildTimeApi}/users`);
      // The same value is a hard failure once the validated layer loads.
      await expect(import('@/config/dependency-injection-config')).rejects.toThrow(
        /Invalid runtime configuration[\s\S]*apiBaseUrl/
      );
    }
  );

  it('accepts the empty flags object the committed block ships', async () => {
    renderRuntimeConfig(buildFeatureFlagConfig({}));

    const { container, tokens } = await loadRuntimeGraph();

    expect(container.resolve<AppConfig>(tokens.appConfig).get()).toEqual({ flags: {} });
  });

  it('reads flag values through the container-resolved service on every call', async () => {
    renderRuntimeConfig(buildFeatureFlagConfig({}));

    const { container, tokens } = await loadRuntimeGraph();
    const flags = container.resolve<FeatureFlagService>(tokens.featureFlagService);
    jest.spyOn(flags, 'names').mockReturnValue([PROBE_FLAG as never]);
    document.getElementById(APP_CONFIG_ELEMENT_ID)?.remove();
    renderRuntimeConfig(buildFeatureFlagConfig({ [PROBE_FLAG]: true }));

    expect(flags.isEnabled(PROBE_FLAG as never)).toBe(true);
    expect(flags.snapshot()).toEqual({ [PROBE_FLAG]: true });
  });

  it('fails fast when the rendered block declares a flag the build no longer knows', async () => {
    renderRuntimeConfig(buildFeatureFlagConfig({ retiredFlag: true }));

    await expect(import('@/config/dependency-injection-config')).rejects.toThrow(
      /Invalid runtime configuration[\s\S]*retiredFlag/
    );
  });

  it('fails fast when the rendered block violates the schema', async () => {
    renderRuntimeConfig(JSON.stringify({ graphqlUrl: 'not-a-url' }));

    await expect(import('@/config/dependency-injection-config')).rejects.toThrow(
      /Invalid runtime configuration/
    );
  });

  it('fails fast when the rendered block is not valid JSON', async () => {
    renderRuntimeConfig('{ "flags": ');

    await expect(import('@/config/dependency-injection-config')).rejects.toThrow(
      /does not contain valid JSON/
    );
  });

  it('fails fast when the rendered block is not a JSON object', async () => {
    renderRuntimeConfig(JSON.stringify([{ apiBaseUrl: buildHttpUrl() }]));

    await expect(import('@/config/dependency-injection-config')).rejects.toThrow(
      /must contain a JSON object/
    );
  });
});
