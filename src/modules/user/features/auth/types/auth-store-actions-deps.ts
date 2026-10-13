import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthStateWriter } from '@auth/types/auth-store';
import type AuthRequestErrors from '@auth/utils/auth-request-errors';
import type AuthSecuritySignals from '@auth/utils/auth-security-signals';

export interface AuthStoreActionsDeps {
  readonly repository: AuthRepository;
  readonly authRequestErrors: AuthRequestErrors;
  readonly authState: AuthStateWriter;
  readonly securitySignals: AuthSecuritySignals;
  readonly sandboxDemoSession: SandboxDemoSessionProvider;
}
