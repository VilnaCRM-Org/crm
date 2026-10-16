import { ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { inject, injectable } from 'tsyringe';
import type { StoreApi } from 'zustand';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { AuthSessionEndHandler } from '@auth/stores/auth-session-end-handler';
import type { AuthState } from '@auth/types/auth-store';

const ANONYMOUS_OPERATIONS: ReadonlySet<string | undefined> = new Set([
  'CreateUser',
  'RequestPasswordReset',
  'ConfirmPasswordReset',
  'SignInUser',
  'CompleteTwoFactorUser',
]);

@injectable()
export default class SessionLinkFactory {
  constructor(
    @inject(AUTH_TOKENS.AuthStore) private readonly authStore: StoreApi<AuthState>,
    @inject(AUTH_TOKENS.AuthSessionEndHandler)
    private readonly sessionEnd: AuthSessionEndHandler
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
      this.sessionEnd.endSession();
    });
  }

  private isAnonymous(operationName: string | undefined): boolean {
    return ANONYMOUS_OPERATIONS.has(operationName);
  }

  private isUnauthorized(networkError: unknown): boolean {
    return (networkError as { statusCode?: unknown } | null | undefined)?.statusCode === 401;
  }
}
