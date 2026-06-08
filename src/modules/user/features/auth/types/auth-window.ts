declare global {
  interface Window {
    __PRELOADED_AUTH_TOKEN__?: string;
  }
}

export type AuthTokenWindow = Pick<Window, '__PRELOADED_AUTH_TOKEN__'>;
