declare global {
  interface Window {
    __PRELOADED_AUTH_TOKEN__?: string;
  }
}

export type PreloadedAuthWindow = Pick<Window, '__PRELOADED_AUTH_TOKEN__'>;
