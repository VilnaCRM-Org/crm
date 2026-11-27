import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type { AuthState, AuthStateWriter } from '@auth/types/auth-store';
import type { EarlierSession } from '@auth/types/earlier-session';

export interface SignInSubmitContext {
  readonly loader: AuthProviderLoader;
  readonly store: AuthStateWriter;
  readonly demoSession: SandboxDemoSessionProvider;
  readonly session: EarlierSession;
  readonly signedOut: AuthState;
}
