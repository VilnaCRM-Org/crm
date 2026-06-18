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
class DeferredAuthActions {
  private instance?: Promise<AuthStoreActions>;

  private readonly loadFailure: AuthError = {
    kind: 'network',
    displayMessage: 'Failed to load the authentication service. Please try again.',
    retryable: true,
  };

  public async login(credentials: LoginUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ loginLoading: true, loginError: null });
    const actions = await this.resolveSafely((error) =>
      AuthStateVar.set({ loginLoading: false, loginError: error })
    );
    if (actions) await actions.login(credentials, signal);
  }

  public async register(credentials: RegisterUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ registerLoading: true, registerError: null, user: null });
    const actions = await this.resolveSafely((error) =>
      AuthStateVar.set({ registerLoading: false, registerError: error })
    );
    if (actions) await actions.register(credentials, signal);
  }

  private async resolveSafely(
    onFailure: (error: AuthError) => void
  ): Promise<AuthStoreActions | null> {
    try {
      return await (this.instance ??= this.load());
    } catch (error) {
      console.error('Auth module failed to load; surfacing retryable error to the user.', error);
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

const deferredAuthActions = new DeferredAuthActions();

export const authActions: AuthActions = {
  loginUser: (credentials, signal) => deferredAuthActions.login(credentials, signal),
  registerUser: (credentials, signal) => deferredAuthActions.register(credentials, signal),
  logout: () => AuthStateVar.reset(),
  reset: () => AuthStateVar.reset(),
  resetRegistration: () => AuthStateVar.resetRegistration(),
  clearLoginError: () => AuthStateVar.clearLoginError(),
};

export { default as AuthStoreSelectors } from './auth-store-selectors';
export { AuthStateVar, useAuthState, useAuthToken };
export type { AuthState } from '@auth/types/auth-store';
