import loadIsolated from '@tests/unit/utils/isolated-module';

type AppConfigSource = (typeof import('@/config/runtime/app-config-source'))['default'];

const loadAppConfigSource = (): Promise<AppConfigSource> =>
  loadIsolated(async () => (await import('@/config/runtime/app-config-source')).default);

const stubConfigElement = (textContent: string | null): void => {
  jest.spyOn(document, 'getElementById').mockReturnValue({ textContent } as unknown as HTMLElement);
};

describe('app config source with an unreadable config element', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('treats an element carrying no text content as an absent configuration block', async () => {
    stubConfigElement(null);
    const appConfigSource = await loadAppConfigSource();

    expect(appConfigSource.load()).toEqual({});
  });

  it('reports no value for a key when the element carries no text content', async () => {
    stubConfigElement(null);
    const appConfigSource = await loadAppConfigSource();

    expect(appConfigSource.text('apiBaseUrl')).toBeUndefined();
    expect(appConfigSource.flags()).toEqual({});
  });

  it('still parses an element that does carry a JSON block', async () => {
    stubConfigElement('{"apiBaseUrl":"https://example.test"}');
    const appConfigSource = await loadAppConfigSource();

    expect(appConfigSource.url('apiBaseUrl')).toBe('https://example.test');
  });
});
