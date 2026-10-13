import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
import type { AppConfigValues } from '@/config/runtime/types/app-config';
import { buildAppConfigValues, buildHttpUrl } from '@tests/builders';
import { clearConfigBlock, writeConfigBlock } from '@tests/utils/config-block';

type AppConfigSourceModule = typeof import('@/config/runtime/app-config-source');
type AppConfigSourceSingleton = AppConfigSourceModule['default'];

// The element id and both failure messages are a fixed contract shared with the HTML shell
// (public/index.html) and the container entrypoint (scripts/render-app-config.js), so they are
// spelled out here rather than rebuilt from the source's own template.
const INVALID_JSON_PREFIX =
  'The #app-runtime-config runtime configuration block does not contain valid JSON:';
const NOT_AN_OBJECT_MESSAGE =
  'The #app-runtime-config runtime configuration block must contain a JSON object.';

async function loadSource(): Promise<AppConfigSourceSingleton> {
  jest.resetModules();
  const runtimeModule = await import('@/config/runtime/app-config-source');

  return runtimeModule.default;
}

describe('appConfigSource', () => {
  beforeEach(() => {
    clearConfigBlock();
  });

  afterAll(() => {
    clearConfigBlock();
  });

  it('publishes the element id the HTML shell and the renderer agree on', () => {
    expect(APP_CONFIG_ELEMENT_ID).toBe('app-runtime-config');
  });

  describe('validated', () => {
    it('hands an empty record to the parser when the block is absent', async () => {
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));
      const source = await loadSource();

      source.validated(parse);

      expect(parse).toHaveBeenCalledWith({});
    });

    it('hands the JSON object carried by the configuration block to the parser', async () => {
      const values = buildAppConfigValues({
        apiBaseUrl: buildHttpUrl('/api'),
        graphqlUrl: buildHttpUrl('/graphql'),
      });
      writeConfigBlock(JSON.stringify(values));
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

      const source = await loadSource();
      source.validated(parse);

      expect(parse).toHaveBeenCalledWith(values);
    });

    it("returns the parser's own result", async () => {
      const values = buildAppConfigValues({ apiBaseUrl: buildHttpUrl('/api') });
      const parse = jest.fn<AppConfigValues, [unknown]>(() => values);

      const source = await loadSource();

      expect(source.validated(parse)).toBe(values);
    });

    it('passes raw values through to the parser without narrowing them', async () => {
      writeConfigBlock('{"apiBaseUrl":1,"extra":true}');
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

      const source = await loadSource();
      source.validated(parse);

      expect(parse).toHaveBeenCalledWith({ apiBaseUrl: 1, extra: true });
    });

    it('hands an empty record to the parser when the block holds only whitespace', async () => {
      writeConfigBlock('   \n\t  ');
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

      const source = await loadSource();
      source.validated(parse);

      expect(parse).toHaveBeenCalledWith({});
    });

    it('throws a named error when the configuration block is not valid JSON', async () => {
      writeConfigBlock('{ "flags": ');
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

      const source = await loadSource();

      expect(() => source.validated(parse)).toThrow(INVALID_JSON_PREFIX);
      expect(parse).not.toHaveBeenCalled();
    });

    it.each([
      ['an array', '[1, 2, 3]'],
      ['a string', '"probeFlag"'],
      ['a number', '42'],
      ['null', 'null'],
    ])('throws when the configuration block contains %s', async (_label, json) => {
      writeConfigBlock(json);
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

      const source = await loadSource();

      expect(() => source.validated(parse)).toThrow(NOT_AN_OBJECT_MESSAGE);
      expect(parse).not.toHaveBeenCalled();
    });

    it('parses again only when the configuration text changes', async () => {
      const first = buildAppConfigValues({ apiBaseUrl: buildHttpUrl('/first') });
      const second = buildAppConfigValues({ apiBaseUrl: buildHttpUrl('/second') });
      const element = writeConfigBlock(JSON.stringify(first));
      const parse = jest.fn<AppConfigValues, [unknown]>(() => ({}));

      const source = await loadSource();
      const parseSpy = jest.spyOn(JSON, 'parse');

      try {
        source.validated(parse);
        source.validated(parse);

        expect(parse).toHaveBeenNthCalledWith(1, first);
        expect(parse.mock.calls[0]?.[0]).toBe(parse.mock.calls[1]?.[0]);
        expect(parseSpy).toHaveBeenCalledTimes(1);

        element.textContent = JSON.stringify(second);
        source.validated(parse);

        expect(parse).toHaveBeenNthCalledWith(3, second);
        expect(parseSpy).toHaveBeenCalledTimes(2);
      } finally {
        parseSpy.mockRestore();
      }
    });
  });

  describe('load', () => {
    it('accepts a valid configuration block', async () => {
      const values = buildAppConfigValues({ graphqlUrl: buildHttpUrl('/graphql') });
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(() => source.load()).not.toThrow();
    });

    it('fails fast when the configuration block is not a JSON object', async () => {
      writeConfigBlock('[1, 2, 3]');

      const source = await loadSource();

      expect(() => source.load()).toThrow(NOT_AN_OBJECT_MESSAGE);
    });

    it('fails fast when the configuration block is not valid JSON', async () => {
      writeConfigBlock('{ "flags": ');

      const source = await loadSource();

      expect(() => source.load()).toThrow(INVALID_JSON_PREFIX);
    });
  });

  describe('text', () => {
    it('returns the trimmed string value of a key', async () => {
      const apiBaseUrl = buildHttpUrl('/api');
      writeConfigBlock(JSON.stringify({ apiBaseUrl: `  ${apiBaseUrl}  ` }));

      const source = await loadSource();

      expect(source.text('apiBaseUrl')).toBe(apiBaseUrl);
    });

    it.each([
      ['is missing', {}],
      ['is not a string', { apiBaseUrl: 42 }],
      ['is an empty string', { apiBaseUrl: '' }],
      ['is whitespace only', { apiBaseUrl: '   ' }],
    ])('is undefined when the value %s', async (_label, values) => {
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.text('apiBaseUrl')).toBeUndefined();
    });
  });

  // The paint path reads endpoints before the zod layer exists, so this accessor carries the same
  // http(s)-only contract as the schema in app-config-schema.ts and `assertHttpUrl` in the
  // container entrypoint. Anything else is reported as absent so the caller falls back.
  describe('url', () => {
    it.each([
      'http://api.example',
      'https://api.example/v1',
      // Single-label and numeric hosts: the compose service names and localhost defaults this
      // repo deploys with must stay acceptable at every layer.
      'http://localhost:4000',
      'http://prod:3001',
      'http://127.0.0.1:8080',
    ])('returns the absolute http(s) URL %s', async (apiBaseUrl) => {
      writeConfigBlock(JSON.stringify({ apiBaseUrl: `  ${apiBaseUrl}  ` }));

      const source = await loadSource();

      expect(source.url('apiBaseUrl')).toBe(apiBaseUrl);
    });

    it.each([
      ['is missing', {}],
      ['is not a string', { apiBaseUrl: 42 }],
      ['is whitespace only', { apiBaseUrl: '   ' }],
      ['is not a URL at all', { apiBaseUrl: 'not-a-url' }],
      ['is a relative path', { apiBaseUrl: '/api' }],
      ['uses the mailto scheme', { apiBaseUrl: 'mailto:someone@example.com' }],
      ['uses the ftp scheme', { apiBaseUrl: 'ftp://files.example/api' }],
      ['uses the javascript scheme', { apiBaseUrl: 'javascript:alert(1)' }],
    ])('is undefined when the value %s', async (_label, values) => {
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.url('apiBaseUrl')).toBeUndefined();
    });
  });

  describe('flag', () => {
    it.each([true, false])('returns the declared boolean %s', async (probeFlag) => {
      writeConfigBlock(JSON.stringify({ flags: { probeFlag } }));

      const source = await loadSource();

      expect(source.flag('probeFlag' as never)).toBe(probeFlag);
    });

    it.each([
      ['absent', {}],
      ['an array', { flags: [] }],
      ['a string', { flags: 'probeFlag' }],
      ['null', { flags: null }],
    ])('is undefined when flags is %s', async (_label, values) => {
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.flag('probeFlag' as never)).toBeUndefined();
    });

    it.each([
      ['a string', 'true'],
      ['a number', 1],
      ['null', null],
    ])('is undefined when the flag value is %s', async (_label, probeFlag) => {
      writeConfigBlock(JSON.stringify({ flags: { probeFlag } }));

      const source = await loadSource();

      expect(source.flag('probeFlag' as never)).toBeUndefined();
    });
  });
});
