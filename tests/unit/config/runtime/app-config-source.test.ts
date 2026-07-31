import { APP_CONFIG_ELEMENT_ID } from '@/config/runtime/app-config-source';
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

  describe('snapshot', () => {
    it('is empty when the configuration block is absent from the document', async () => {
      const source = await loadSource();

      expect(source.snapshot()).toEqual({});
    });

    it('parses the JSON object carried by the configuration block', async () => {
      const values = buildAppConfigValues({
        apiBaseUrl: buildHttpUrl('/api'),
        graphqlUrl: buildHttpUrl('/graphql'),
      });
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.snapshot()).toEqual(values);
    });

    it('is empty when the configuration block holds only whitespace', async () => {
      writeConfigBlock('   \n\t  ');

      const source = await loadSource();

      expect(source.snapshot()).toEqual({});
    });

    it('throws a named error when the configuration block is not valid JSON', async () => {
      writeConfigBlock('{ "flags": ');

      const source = await loadSource();

      expect(() => source.snapshot()).toThrow(INVALID_JSON_PREFIX);
    });

    it.each([
      ['an array', '[1, 2, 3]'],
      ['a string', '"forgotPassword"'],
      ['a number', '42'],
      ['null', 'null'],
    ])('throws when the configuration block contains %s', async (_label, json) => {
      writeConfigBlock(json);

      const source = await loadSource();

      expect(() => source.snapshot()).toThrow(NOT_AN_OBJECT_MESSAGE);
    });

    it('parses again only when the configuration text changes', async () => {
      const first = buildAppConfigValues({ apiBaseUrl: buildHttpUrl('/first') });
      const second = buildAppConfigValues({ apiBaseUrl: buildHttpUrl('/second') });
      const element = writeConfigBlock(JSON.stringify(first));

      const source = await loadSource();
      const parseSpy = jest.spyOn(JSON, 'parse');

      try {
        expect(source.snapshot()).toEqual(first);
        expect(source.snapshot()).toEqual(first);
        expect(source.snapshot()).toBe(source.snapshot());
        expect(parseSpy).toHaveBeenCalledTimes(1);

        element.textContent = JSON.stringify(second);

        expect(source.snapshot()).toEqual(second);
        expect(parseSpy).toHaveBeenCalledTimes(2);
      } finally {
        parseSpy.mockRestore();
      }
    });

    it('reads nothing when there is no document to read from', async () => {
      const values = buildAppConfigValues({ apiBaseUrl: buildHttpUrl('/api') });
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.snapshot()).toEqual(values);

      const documentSpy = jest.spyOn(globalThis, 'document', 'get');
      documentSpy.mockImplementation((): Document => undefined as unknown as Document);

      let snapshot: Record<string, unknown> = { unread: true };

      try {
        snapshot = source.snapshot();
      } finally {
        documentSpy.mockRestore();
      }

      expect(snapshot).toEqual({});
    });
  });

  describe('load', () => {
    it('returns the same snapshot instance', async () => {
      const values = buildAppConfigValues({ graphqlUrl: buildHttpUrl('/graphql') });
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.load()).toEqual(values);
      expect(source.load()).toBe(source.snapshot());
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

  describe('flags', () => {
    it('returns the flags object when the configuration declares one', async () => {
      writeConfigBlock(JSON.stringify({ flags: { forgotPassword: true } }));

      const source = await loadSource();

      expect(source.flags()).toEqual({ forgotPassword: true });
    });

    it.each([
      ['absent', {}],
      ['an array', { flags: [] }],
      ['a string', { flags: 'forgotPassword' }],
      ['null', { flags: null }],
    ])('is empty when flags is %s', async (_label, values) => {
      writeConfigBlock(JSON.stringify(values));

      const source = await loadSource();

      expect(source.flags()).toEqual({});
    });
  });
});
