import sandboxDemoSessionProvider, {
  type SandboxDemoSessionProvider,
} from '@/config/env/sandbox-demo-session-provider';
import observabilityCore from '@/services/observability/observability-core';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type { AuthStateWriter } from '@auth/types/auth-store';

import useAuthStore, { CLEARED_AUTH_STATE } from './use-auth-store';

export class AuthSessionEndHandler {
  constructor(
    private readonly state: AuthStateWriter,
    private readonly observability: ObservabilityService,
    private readonly sandboxDemoSession: SandboxDemoSessionProvider
  ) {}

  public endSession(): void {
    this.observability.clearUser();
    this.sandboxDemoSession.signOut();
    this.state.setState(CLEARED_AUTH_STATE);
  }
}

export default new AuthSessionEndHandler(
  useAuthStore,
  observabilityCore,
  sandboxDemoSessionProvider
);
