import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { AuthProviderLoader } from '@auth/stores';
import type { AuthStateWriter } from '@auth/types/auth-store';

export interface SignInSubmitContext {
  readonly loader: AuthProviderLoader;
  readonly store: AuthStateWriter;
  readonly demoSession: SandboxDemoSessionProvider;
}
