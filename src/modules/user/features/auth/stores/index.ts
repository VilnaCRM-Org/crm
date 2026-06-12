import type { AuthError } from '@auth/types/auth-error';
import type { AuthActions } from '@auth/types/auth-store';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';

import type AuthStoreActions from './auth-store-actions';
import AuthStateVar, { useAuthState } from './auth-var';
import useAuthToken from './use-auth-token';

// Composition root: the DI graph (Apollo, zod, repositories) loads on the first auth
// action, not at module load, so the authentication page never waits on it. Loading
// flags must be set before the await so submit feedback stays synchronous (WCAG 4.1.3).
class DeferredAuthActions {
  private static instance?: Promise<AuthStoreActions>;

  private static readonly loadFailure: AuthError = {
    kind: 'network',
    displayMessage: 'Failed to load the sign-in service. Please try again.',
    retryable: true,
  };

  public static async login(credentials: LoginUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ loginLoading: true, loginError: null });
    const actions = await DeferredAuthActions.resolveSafely((error) =>
      AuthStateVar.set({ loginLoading: false, loginError: error })
    );
    if (actions) await actions.login(credentials, signal);
  }

  public static async register(credentials: RegisterUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ registerLoading: true, registerError: null, user: null });
    const actions = await DeferredAuthActions.resolveSafely((error) =>
      AuthStateVar.set({ registerLoading: false, registerError: error })
    );
    if (actions) await actions.register(credentials, signal);
  }

  private static async resolveSafely(
    onFailure: (error: AuthError) => void
  ): Promise<AuthStoreActions | null> {
    try {
      return await (DeferredAuthActions.instance ??= DeferredAuthActions.load());
    } catch (error) {
      console.error('Auth module failed to load; surfacing retryable error to the user.', error);
      DeferredAuthActions.instance = undefined;
      onFailure(DeferredAuthActions.loadFailure);
      return null;
    }
  }

  // The container import must finish first: it loads reflect-metadata, which the
  // @injectable decorator on the action class needs at definition time.
  private static async load(): Promise<AuthStoreActions> {
    const { default: container } = await import('@/config/dependency-injection-config');
    const { default: ActionsClass } = await import('./auth-store-actions');
    return container.resolve(ActionsClass);
  }
}

export const authActions: AuthActions = {
  loginUser: (credentials, signal) => DeferredAuthActions.login(credentials, signal),
  registerUser: (credentials, signal) => DeferredAuthActions.register(credentials, signal),
  logout: AuthStateVar.reset,
  reset: AuthStateVar.reset,
  resetRegistration: AuthStateVar.resetRegistration,
  clearLoginError: AuthStateVar.clearLoginError,
};

export { default as AuthStoreSelectors } from './auth-store-selectors';
export { AuthStateVar, useAuthState, useAuthToken };
export type { AuthState } from '@auth/types/auth-store';
