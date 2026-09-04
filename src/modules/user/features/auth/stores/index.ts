import accessSession from '@/lib/access/access-session';
import observabilityCore from '@/services/observability/observability-core';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthActions } from '@auth/types/auth-store';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';

import type AuthStoreActions from './auth-store-actions';
import AuthStateVar from './auth-var';
import useAuthState from './use-auth-state';
import useAuthToken from './use-auth-token';

// Composition root: the DI graph (Apollo, zod, repositories) loads on the first auth
// action, not at module load, so the authentication page never waits on it. Loading
// flags must be set before the await so submit feedback stays synchronous (WCAG 4.1.3).
class DeferredAuthActions implements AuthActions {
  private instance?: Promise<AuthStoreActions>;

  private readonly loadFailure: AuthError = {
    kind: 'network',
    displayMessage: 'Failed to load the authentication service. Please try again.',
    retryable: true,
  };

  public async loginUser(credentials: LoginUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ loginLoading: true, loginError: null });
    const actions = await this.resolveSafely((error) =>
      AuthStateVar.set({ loginLoading: false, loginError: error })
    );
    if (actions) await actions.login(credentials, signal);
    accessSession.sync(AuthStateVar.get());
  }

  public async registerUser(credentials: RegisterUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ registerLoading: true, registerError: null, user: null });
    const actions = await this.resolveSafely((error) =>
      AuthStateVar.set({ registerLoading: false, registerError: error })
    );
    if (actions) await actions.register(credentials, signal);
  }

  public logout(): void {
    observabilityCore.clearUser();
    accessSession.end();
    AuthStateVar.reset();
  }

  public reset(): void {
    AuthStateVar.reset();
  }

  public resetRegistration(): void {
    AuthStateVar.resetRegistration();
  }

  public clearLoginError(): void {
    AuthStateVar.clearLoginError();
  }

  private async resolveSafely(
    onFailure: (error: AuthError) => void
  ): Promise<AuthStoreActions | null> {
    try {
      return await (this.instance ??= this.load());
    } catch (error) {
      console.error('Auth module failed to load; surfacing retryable error to the user.', error);
      observabilityCore.captureError(error, { source: 'auth:module-load' });
      this.instance = undefined;
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

export const authActions: AuthActions = new DeferredAuthActions();

export { default as AuthStoreSelectors } from './auth-store-selectors';
export { AuthStateVar, useAuthState, useAuthToken };
export type { AuthState } from '@auth/types/auth-store';
