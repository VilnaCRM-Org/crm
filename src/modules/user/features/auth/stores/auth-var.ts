import type { AuthState } from '@auth/types/auth-store';
import type { AuthTokenWindow } from '@auth/types/auth-window';
import type { ReactiveVar } from '@auth/types/reactive-var';

import ReactiveVarFactory from './reactive-var';

const WINDOW_KEY = '__PRELOADED_AUTH_TOKEN__' as const;

const CLEARED_STATE: AuthState = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

export class AuthStateVar {
  public readonly windowKey = WINDOW_KEY;

  private readonly cleared: AuthState = CLEARED_STATE;

  private readonly state: ReactiveVar<AuthState>;

  constructor() {
    this.state = new ReactiveVarFactory().create<AuthState>({
      ...this.cleared,
      token: this.readSeedToken(),
    });
  }

  public reactiveVar(): ReactiveVar<AuthState> {
    return this.state;
  }

  public get(): AuthState {
    return this.state();
  }

  public set(partial: Partial<AuthState>): void {
    this.state({ ...this.state(), ...partial });
  }

  public reset(): void {
    this.state({ ...this.cleared });
  }

  public resetRegistration(): void {
    this.set({ user: null, registerError: null, registerLoading: false });
  }

  public clearLoginError(): void {
    this.set({ loginError: null });
  }

  // Seeds an authenticated state for Lighthouse/Playwright runs without a real login.
  // The token may be injected on `window` (Playwright) or via the build-time env var (LHCI).
  public readSeedToken(
    currentWindow: AuthTokenWindow | undefined = typeof window !== 'undefined' ? window : undefined,
    envToken: string | undefined = this.readEnvToken()
  ): string | null {
    const windowToken = currentWindow?.[this.windowKey]?.trim() || undefined;
    const seedToken = envToken?.trim() || undefined;
    return windowToken || seedToken || null;
  }

  private readEnvToken(): string | undefined {
    // Must be a static `process.env.<LITERAL>` access so the bundler can inline it at build
    // time (LHCI); a dynamic key would never be replaced and is undefined in the browser.
    try {
      return process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN?.trim() || undefined;
    } catch {
      return undefined;
    }
  }
}

const authStateVar = new AuthStateVar();

export default authStateVar;
