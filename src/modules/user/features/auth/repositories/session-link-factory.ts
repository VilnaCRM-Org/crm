import { ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { inject, injectable } from 'tsyringe';
import type { StoreApi } from 'zustand';

import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type { AuthState } from '@auth/types/auth-store';

const ANONYMOUS_OPERATIONS: ReadonlySet<string | undefined> = new Set([
  'CreateUser',
  'RequestPasswordReset',
  'ConfirmPasswordReset',
  'SignInUser',
  'CompleteTwoFactorUser',
]);

const SIGNED_OUT: AuthState = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

@injectable()
export default class SessionLinkFactory {
  constructor(
    @inject(AUTH_TOKENS.AuthStore) private readonly authStore: StoreApi<AuthState>,
    @inject(AUTH_TOKENS.SandboxDemoSessionProvider)
    private readonly sandboxDemoSession: SandboxDemoSessionProvider,
    @inject(OBSERVABILITY_TOKENS.ObservabilityService)
    private readonly observability: ObservabilityService
  ) {}

  public build(): ApolloLink {
    return ApolloLink.from([this.tokenLink(), this.endSessionLink()]);
  }

  private tokenLink(): ApolloLink {
    return setContext((operation, previousContext: { headers?: Record<string, string> }) => {
      const { token } = this.authStore.getState();
      if (token === null || this.isAnonymous(operation.operationName)) return {};
      return { headers: { ...previousContext.headers, Authorization: `Bearer ${token}` } };
    });
  }

  private endSessionLink(): ApolloLink {
    return onError(({ operation, networkError }) => {
      if (this.isAnonymous(operation.operationName) || !this.isUnauthorized(networkError)) return;
      this.observability.clearUser();
      this.sandboxDemoSession.signOut();
      this.authStore.setState(SIGNED_OUT);
    });
  }

  private isAnonymous(operationName: string | undefined): boolean {
    return ANONYMOUS_OPERATIONS.has(operationName);
  }

  private isUnauthorized(networkError: unknown): boolean {
    return (networkError as { statusCode?: unknown } | null | undefined)?.statusCode === 401;
  }
}
