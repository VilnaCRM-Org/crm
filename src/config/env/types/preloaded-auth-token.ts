declare global {
  interface Window {
    __PRELOADED_AUTH_TOKEN__?: string;
  }
}

export type PreloadedAuthTokenWindow = Pick<Window, '__PRELOADED_AUTH_TOKEN__'>;
