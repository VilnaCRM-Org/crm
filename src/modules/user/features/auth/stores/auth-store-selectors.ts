import type { SafeUserInfo } from '@auth/types/api-responses';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthState } from '@auth/types/auth-store';

class AuthStoreSelectors {
  public email(state: AuthState): string {
    return state.email;
  }

  public token(state: AuthState): string | null {
    return state.token;
  }

  public isAuthenticated(state: AuthState): boolean {
    return !!state.token;
  }

  public loginLoading(state: AuthState): boolean {
    return state.loginLoading;
  }

  public loginError(state: AuthState): AuthError | null {
    return state.loginError;
  }

  public registerLoading(state: AuthState): boolean {
    return state.registerLoading;
  }

  public registerError(state: AuthState): AuthError | null {
    return state.registerError;
  }

  public registerUser(state: AuthState): SafeUserInfo | null {
    return state.user;
  }

  public registerRetryable(state: AuthState): boolean | undefined {
    return state.registerError?.retryable;
  }
}

const authStoreSelectors = new AuthStoreSelectors();

export default authStoreSelectors;
