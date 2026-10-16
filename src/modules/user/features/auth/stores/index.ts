import type { DependencyContainer, InjectionToken } from 'tsyringe';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import observabilityCore from '@/services/observability/observability-core';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthActions, AuthStateWriter } from '@auth/types/auth-store';

import authSessionEndHandler, { type AuthSessionEndHandler } from './auth-session-end-handler';
import type AuthStoreActions from './auth-store-actions';
import useAuthState from './use-auth-state';
import useAuthStore, { CLEARED_AUTH_STATE } from './use-auth-store';
import useAuthToken from './use-auth-token';

// Composition root: the DI graph (Apollo, zod, repositories) loads on the first auth
// action, not at module load, so the authentication page never waits on it. Loading
// flags must be set before the await so submit feedback stays synchronous (WCAG 4.1.3).
class DeferredAuthActions implements AuthActions {
  // The DI graph is a lazy chunk like any page: one chunk-load failure is retried before the
  // user sees the retryable load error, and a failed load is forgotten so the next action can
  // try again (issue #147).
  private readonly state: AuthStateWriter = useAuthStore;

  private readonly sessionEnd: AuthSessionEndHandler = authSessionEndHandler;

  private readonly loader = new ChunkRetryLoader(() => this.load());

  private readonly loadFailure: AuthError = {
    kind: 'network',
    displayMessage: 'Failed to load the authentication service. Please try again.',
    retryable: true,
  };

  public async loginUser(credentials: SignInDto, signal?: AbortSignal): Promise<void> {
    this.state.setState({ loginLoading: true, loginError: null });
    const actions = await this.resolveSafely((error) =>
      this.state.setState({ loginLoading: false, loginError: error })
    );
    if (actions) await actions.login(credentials, signal);
  }

  public async registerUser(credentials: SignUpDto, signal?: AbortSignal): Promise<void> {
    this.state.setState({ registerLoading: true, registerError: null, user: null });
    const actions = await this.resolveSafely((error) =>
      this.state.setState({ registerLoading: false, registerError: error })
    );
    if (actions) await actions.register(credentials, signal);
  }

  public logout(): void {
    this.sessionEnd.endSession();
  }

  public reset(): void {
    this.state.setState(CLEARED_AUTH_STATE);
  }

  public resetRegistration(): void {
    this.state.setState({ user: null, registerError: null, registerLoading: false });
  }

  public clearLoginError(): void {
    this.state.setState({ loginError: null });
  }

  private async resolveSafely(
    onFailure: (error: AuthError) => void
  ): Promise<AuthStoreActions | null> {
    try {
      return await this.loader.load();
    } catch (error) {
      console.error('Auth module failed to load; surfacing retryable error to the user.', error);
      observabilityCore.captureError(error, { source: 'auth:module-load' });
      onFailure(this.loadFailure);
      return null;
    }
  }

  // The container import must finish first: it loads reflect-metadata, which the
  // @injectable decorator on the action class needs at definition time.
  private async load(): Promise<AuthStoreActions> {
    const { default: container } = await import('@/config/dependency-injection-config');
    const { default: ActionsClass } = await import('./auth-store-actions');
    return container.resolve(ActionsClass);
  }
}

export class AuthProviderLoader {
  private readonly container = new ChunkRetryLoader(
    () => import('@/config/dependency-injection-config')
  );

  public async resolve<T>(token: InjectionToken<T>): Promise<T> {
    const container = await this.loadContainer();
    try {
      return container.resolve<T>(token);
    } catch (error) {
      observabilityCore.captureError(error, { source: 'auth:provider-resolve' });
      throw error;
    }
  }

  private async loadContainer(): Promise<DependencyContainer> {
    try {
      const { default: container } = await this.container.load();
      return container;
    } catch (error) {
      observabilityCore.captureError(error, { source: 'auth:provider-load' });
      throw error;
    }
  }
}

export const authActions: AuthActions = new DeferredAuthActions();

export { default as AuthStoreSelectors } from './auth-store-selectors';
export { useAuthState, useAuthStore, useAuthToken };
export type { AuthState } from '@auth/types/auth-store';
