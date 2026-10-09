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

export interface RawEnvSnapshot {
  readonly nodeEnv: string | undefined;
  readonly graphqlUrl: string | undefined;
  readonly mockoonUrl: string | undefined;
  readonly mainLanguage: string | undefined;
  readonly fallbackLanguage: string | undefined;
  readonly release: string | undefined;
  readonly sentryDsn: string | undefined;
  readonly sentryEnvironment: string | undefined;
  readonly authFailureAlertThreshold: string | undefined;
  readonly authFailureAlertWindowMs: string | undefined;
  readonly requestTimeoutMs: string | undefined;
}

export interface AuthFailureAlertEnv {
  readonly threshold?: string | undefined;
  readonly windowMs?: string | undefined;
}
