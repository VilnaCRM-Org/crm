import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import type { ProtectedSession } from '@/routes/types/protected-outlet-context';
import observabilityCore from '@/services/observability/observability-core';

import useAuthStore, { CLEARED_AUTH_STATE } from './use-auth-store';

class AuthSessionProvider implements ProtectedSession {
  public token(): string | null {
    return useAuthStore.getState().token;
  }

  public end(token: string): void {
    if (token === this.token()) this.signOut();
  }

  public signOut(): void {
    observabilityCore.clearUser();
    sandboxDemoSessionProvider.signOut();
    useAuthStore.setState(CLEARED_AUTH_STATE);
  }
}

const authSessionProvider = new AuthSessionProvider();

export default authSessionProvider;
