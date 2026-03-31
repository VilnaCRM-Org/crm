declare global {
  interface Window {
    __PRELOADED_AUTH_TOKEN__?: string;
  }
}

export const preloadedAuthTokenKey = '__PRELOADED_AUTH_TOKEN__' as const;

export type PreloadedAuthWindow = Pick<Window, typeof preloadedAuthTokenKey>;

export function getPreloadedAuthToken(
  currentWindow: PreloadedAuthWindow | undefined = typeof window !== 'undefined'
    ? window
    : undefined,
  envToken: string | undefined = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN
): string | undefined {
  const preloadedEnvToken = envToken?.trim() || undefined;
  const trimmedWindowToken = currentWindow?.[preloadedAuthTokenKey]?.trim() || undefined;

  return trimmedWindowToken || preloadedEnvToken;
}
