import type { StoreApi } from 'zustand';

import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type { AuthState } from '@auth/types/auth-store';

export interface SessionLinkDeps {
  readonly authStore: StoreApi<AuthState>;
  readonly signedOut: AuthState;
  readonly sandboxDemoSession: SandboxDemoSessionProvider;
  readonly observability: ObservabilityService;
  readonly errors: UserServiceErrorTransformer;
}
