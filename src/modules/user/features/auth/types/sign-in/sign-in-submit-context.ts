import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type { AuthState, AuthStateWriter } from '@auth/types/auth-store';

export interface SignInEarlierSession {
  token(): string | null;
  signOut(): void;
}

export interface SignInSubmitContext {
  readonly loader: AuthProviderLoader;
  readonly store: AuthStateWriter;
  readonly demoSession: SandboxDemoSessionProvider;
  readonly session: SignInEarlierSession;
  readonly signedOut: AuthState;
}
