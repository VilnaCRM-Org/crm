import { makeVar, useReactiveVar, type ReactiveVar } from '@apollo/client';

import type { AuthState } from '../types/auth-store';
import type { AuthTokenWindow } from '../types/auth-window';

export default class AuthStateVar {
  public static readonly windowKey = '__PRELOADED_AUTH_TOKEN__' as const;

  private static readonly cleared: AuthState = {
    email: '',
    token: null,
    user: null,
    loginLoading: false,
    loginError: null,
    registerLoading: false,
    registerError: null,
  };

  private static readonly state: ReactiveVar<AuthState> = makeVar<AuthState>({
    ...AuthStateVar.cleared,
    token: AuthStateVar.readSeedToken(),
  });

  public static reactiveVar(): ReactiveVar<AuthState> {
    return AuthStateVar.state;
  }

  public static get(): AuthState {
    return AuthStateVar.state();
  }

  public static set(partial: Partial<AuthState>): void {
    AuthStateVar.state({ ...AuthStateVar.state(), ...partial });
  }

  public static reset(): void {
    AuthStateVar.state({ ...AuthStateVar.cleared });
  }

  public static resetRegistration(): void {
    AuthStateVar.set({ user: null, registerError: null, registerLoading: false });
  }

  public static clearLoginError(): void {
    AuthStateVar.set({ loginError: null });
  }

  // Seeds an authenticated state for Lighthouse/Playwright runs without a real login.
  // The token may be injected on `window` (Playwright) or via the build-time env var (LHCI).
  public static readSeedToken(
    currentWindow: AuthTokenWindow | undefined = typeof window !== 'undefined' ? window : undefined,
    envToken: string | undefined = AuthStateVar.readEnvToken()
  ): string | null {
    const windowToken = currentWindow?.[AuthStateVar.windowKey]?.trim() || undefined;
    const seedToken = envToken?.trim() || undefined;
    return windowToken || seedToken || null;
  }

  private static readEnvToken(): string | undefined {
    // Must be a static `process.env.<LITERAL>` access so the bundler can inline it at build
    // time (LHCI); a dynamic key would never be replaced and is undefined in the browser.
    try {
      return process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN?.trim() || undefined;
    } catch {
      return undefined;
    }
  }
}

export function useAuthState(): AuthState {
  return useReactiveVar(AuthStateVar.reactiveVar());
}
