import { ApolloLink } from '@apollo/client';
import type { NetworkError } from '@apollo/client/errors';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SessionLinkDeps } from '@auth/types/session-link-deps';

const ANONYMOUS_OPERATIONS: ReadonlySet<string | undefined> = new Set([
  'CreateUser',
  'RequestPasswordReset',
  'ConfirmPasswordReset',
  'SignInUser',
  'CompleteTwoFactorUser',
]);

@injectable()
export default class SessionLinkFactory {
  constructor(@inject(AUTH_TOKENS.SessionLinkDeps) private readonly deps: SessionLinkDeps) {}

  public build(): ApolloLink {
    return ApolloLink.from([this.tokenLink(), this.endSessionLink()]);
  }

  private tokenLink(): ApolloLink {
    return setContext((operation, previousContext: { headers?: Record<string, string> }) => {
      const { token } = this.deps.authStore.getState();
      if (token === null || this.isAnonymous(operation.operationName)) return {};
      return { headers: { ...previousContext.headers, Authorization: `Bearer ${token}` } };
    });
  }

  private endSessionLink(): ApolloLink {
    return onError(({ operation, networkError }) => {
      if (this.isAnonymous(operation.operationName) || !this.isUnauthorized(networkError)) return;
      this.endSession();
    });
  }

  private endSession(): void {
    this.deps.observability.clearUser();
    this.deps.sandboxDemoSession.signOut();
    this.deps.authStore.setState(this.deps.signedOut);
  }

  private isAnonymous(operationName: string | undefined): boolean {
    return ANONYMOUS_OPERATIONS.has(operationName);
  }

  private isUnauthorized(networkError: NetworkError | undefined): boolean {
    return this.deps.errors.normalize({ networkError }).reason === 'unauthenticated';
  }
}
