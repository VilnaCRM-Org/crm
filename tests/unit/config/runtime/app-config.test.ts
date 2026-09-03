import { buildAppConfigValues, buildHttpUrl } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

type AppConfigModule = typeof import('@/config/runtime/app-config');

function loadAppConfig(): Promise<AppConfigModule> {
  jest.resetModules();

  return import('@/config/runtime/app-config');
}

describe('appConfig', () => {
  beforeEach(() => {
    clearConfigBlock();
  });

  afterAll(() => {
    clearConfigBlock();
  });

  it('exposes and freezes a valid runtime configuration', async () => {
    const values = buildAppConfigValues({
      apiBaseUrl: buildHttpUrl('/api'),
      graphqlUrl: buildHttpUrl('/graphql'),
      flags: { forgotPassword: true },
    });
    writeConfigBlock(JSON.stringify(values));

    const { default: appConfig, AppConfig } = await loadAppConfig();

    expect(appConfig).toBeInstanceOf(AppConfig);
    expect(appConfig.get()).toEqual(values);
    expect(appConfig.apiBaseUrl()).toBe(values.apiBaseUrl);
    expect(appConfig.graphqlUrl()).toBe(values.graphqlUrl);
    expect(Object.isFrozen(appConfig.get())).toBe(true);
  });

  it('reads an empty configuration when the block is absent', async () => {
    const { default: appConfig } = await loadAppConfig();

    expect(appConfig.get()).toEqual({});
    expect(appConfig.apiBaseUrl()).toBeUndefined();
    expect(appConfig.graphqlUrl()).toBeUndefined();
    expect(Object.isFrozen(appConfig.get())).toBe(true);
  });

  it('freezes the nested flags object, not just the top level', async () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: true } }));

    const { default: appConfig } = await loadAppConfig();
    const flags = appConfig.get().flags;

    expect(Object.isFrozen(flags)).toBe(true);
    expect(() => {
      (flags as { forgotPassword: boolean }).forgotPassword = false;
    }).toThrow(TypeError);
    expect(appConfig.get().flags?.forgotPassword).toBe(true);
  });

  it('fails fast and names the field when a URL is malformed', async () => {
    writeConfigBlock(JSON.stringify({ apiBaseUrl: 'not-a-url' }));

    await expect(loadAppConfig()).rejects.toThrow(/Invalid runtime configuration[\s\S]*apiBaseUrl/);
  });

  it.each(['mailto:someone@example.com', 'ftp://files.example/api', 'javascript:alert(1)'])(
    'rejects the non-http(s) URL %s, matching what the container entrypoint enforces',
    async (apiBaseUrl) => {
      writeConfigBlock(JSON.stringify({ apiBaseUrl }));

      await expect(loadAppConfig()).rejects.toThrow(
        /Invalid runtime configuration[\s\S]*apiBaseUrl/
      );
    }
  );

  it('fails fast and names the key when the configuration carries an unknown setting', async () => {
    writeConfigBlock(JSON.stringify({ mainLanguage: 'uk' }));

    await expect(loadAppConfig()).rejects.toThrow(
      /Invalid runtime configuration[\s\S]*mainLanguage/
    );
  });

  it('fails fast and names the flag when a flag value is not a boolean', async () => {
    writeConfigBlock(JSON.stringify({ flags: { forgotPassword: 'yes' } }));

    await expect(loadAppConfig()).rejects.toThrow(
      /Invalid runtime configuration[\s\S]*forgotPassword/
    );
  });

  it('aggregates every offending field into a single error', async () => {
    writeConfigBlock(
      JSON.stringify({ apiBaseUrl: 'not-a-url', graphqlUrl: 'also-not-a-url', unknownKey: 1 })
    );

    const error = await loadAppConfig().then(
      () => null,
      (thrown: unknown) => thrown as Error
    );

    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/apiBaseUrl/);
    expect(error?.message).toMatch(/graphqlUrl/);
    expect(error?.message).toMatch(/unknownKey/);
  });
});
