import type { PreloadedAuthWindow } from '../types/preloaded-auth-token';

export default class PreloadedAuthToken {
  public static readonly key = '__PRELOADED_AUTH_TOKEN__' as const;

  public static read(
    currentWindow: PreloadedAuthWindow | undefined = typeof window !== 'undefined'
      ? window
      : undefined,
    envToken: string | undefined = PreloadedAuthToken.fromEnv()
  ): string | undefined {
    const preloadedEnvToken = envToken?.trim() || undefined;
    const trimmedWindowToken = currentWindow?.[PreloadedAuthToken.key]?.trim() || undefined;

    return trimmedWindowToken || preloadedEnvToken;
  }

  private static fromEnv(): string | undefined {
    try {
      return process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
    } catch {
      return undefined;
    }
  }
}
