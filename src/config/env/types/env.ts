export interface Env {
  readonly nodeEnv?: 'development' | 'production' | 'test' | undefined;
  readonly graphqlUrl?: string | undefined;
  readonly mockoonUrl?: string | undefined;
  readonly mainLanguage?: 'uk' | 'en' | undefined;
  readonly fallbackLanguage?: 'uk' | 'en' | undefined;
  readonly release?: string | undefined;
  readonly sentryDsn?: string | undefined;
  readonly sentryEnvironment?: string | undefined;
  readonly authFailureAlertThreshold?: number | undefined;
  readonly authFailureAlertWindowMs?: number | undefined;
  readonly requestTimeoutMs?: number | undefined;
}

export interface AuthFailureAlertEnv {
  readonly threshold?: string | undefined;
  readonly windowMs?: string | undefined;
}
