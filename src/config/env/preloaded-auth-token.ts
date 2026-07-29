import type { PreloadedAuthTokenWindow } from './types/preloaded-auth-token';

class PreloadedAuthTokenSeed {
  // Both the gate and every seed read must stay inside this one function body: the bundler
  // folds the guard to `if (true) return null` and drops the rest, but only within a single
  // scope. Moving either read into a helper method or another module keeps the window key and
  // the token literal in the production bundle (issue #158).
  public read(currentWindow?: PreloadedAuthTokenWindow): string | null {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ENABLE_PRELOADED_AUTH_TOKEN_SEED !== 'true'
    ) {
      return null;
    }

    const activeWindow = currentWindow ?? (typeof window === 'undefined' ? undefined : window);

    return (
      activeWindow?.__PRELOADED_AUTH_TOKEN__?.trim() ||
      process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN?.trim() ||
      null
    );
  }
}

const preloadedAuthTokenSeed = new PreloadedAuthTokenSeed();

export default preloadedAuthTokenSeed;
