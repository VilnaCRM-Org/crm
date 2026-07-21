export interface Env {
  readonly nodeEnv?: 'development' | 'production' | 'test';
  readonly graphqlUrl?: string;
  readonly mockoonUrl?: string;
  readonly lhciPreloadedAuthToken?: string;
  readonly mainLanguage?: 'uk' | 'en';
  readonly fallbackLanguage?: 'uk' | 'en';
  readonly release?: string;
  readonly sentryDsn?: string;
  readonly sentryEnvironment?: string;
}
