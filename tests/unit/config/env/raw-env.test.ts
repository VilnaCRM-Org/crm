import rawEnv from '@/config/env/raw-env';

describe('rawEnv', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('mainLanguage', () => {
    it('trims the configured main language', () => {
      process.env.REACT_APP_MAIN_LANGUAGE = '  en  ';
      expect(rawEnv.mainLanguage()).toBe('en');
    });

    it('falls back to uk for a blank or missing main language', () => {
      process.env.REACT_APP_MAIN_LANGUAGE = '   ';
      expect(rawEnv.mainLanguage()).toBe('uk');

      delete process.env.REACT_APP_MAIN_LANGUAGE;
      expect(rawEnv.mainLanguage()).toBe('uk');
    });
  });

  describe('mockoonUrl', () => {
    it('trims the configured mockoon url', () => {
      process.env.REACT_APP_MOCKOON_URL = '  http://localhost:8080  ';
      expect(rawEnv.mockoonUrl()).toBe('http://localhost:8080');
    });

    it('returns an empty string when unset', () => {
      delete process.env.REACT_APP_MOCKOON_URL;
      expect(rawEnv.mockoonUrl()).toBe('');
    });
  });

  describe('lhciPreloadedAuthToken', () => {
    it('trims the configured token', () => {
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = ' token ';
      expect(rawEnv.lhciPreloadedAuthToken()).toBe('token');
    });

    it('is undefined for a blank or missing token', () => {
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = '   ';
      expect(rawEnv.lhciPreloadedAuthToken()).toBeUndefined();

      delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      expect(rawEnv.lhciPreloadedAuthToken()).toBeUndefined();
    });
  });

  describe('snapshot', () => {
    it('shapes every configuration variable into a single object', () => {
      process.env.NODE_ENV = 'test';
      process.env.REACT_APP_GRAPHQL_URL = 'http://localhost:4000/graphql';
      process.env.REACT_APP_MOCKOON_URL = 'http://localhost:8080';
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'seed';
      process.env.REACT_APP_MAIN_LANGUAGE = 'uk';
      process.env.REACT_APP_FALLBACK_LANGUAGE = 'en';
      process.env.REACT_APP_RELEASE = 'v1.2.3';
      process.env.REACT_APP_SENTRY_DSN = 'https://key@sentry.io/1';
      process.env.REACT_APP_SENTRY_ENVIRONMENT = 'staging';

      expect(rawEnv.snapshot()).toEqual({
        nodeEnv: 'test',
        graphqlUrl: 'http://localhost:4000/graphql',
        mockoonUrl: 'http://localhost:8080',
        lhciPreloadedAuthToken: 'seed',
        mainLanguage: 'uk',
        fallbackLanguage: 'en',
        release: 'v1.2.3',
        sentryDsn: 'https://key@sentry.io/1',
        sentryEnvironment: 'staging',
      });
    });
  });
});
