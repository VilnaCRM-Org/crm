import type { SafeUserInfo } from '@auth/types/api-responses';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthState } from '@auth/types/auth-store';

export default class AuthStoreSelectors {
  public static email(state: AuthState): string {
    return state.email;
  }

  public static token(state: AuthState): string | null {
    return state.token;
  }

  public static isAuthenticated(state: AuthState): boolean {
    return !!state.token;
  }

  public static loginLoading(state: AuthState): boolean {
    return state.loginLoading;
  }

  public static loginError(state: AuthState): AuthError | null {
    return state.loginError;
  }

  public static registerLoading(state: AuthState): boolean {
    return state.registerLoading;
  }

  public static registerError(state: AuthState): AuthError | null {
    return state.registerError;
  }

  public static registerUser(state: AuthState): SafeUserInfo | null {
    return state.user;
  }

  public static registerRetryable(state: AuthState): boolean | undefined {
    return state.registerError?.retryable;
  }
}
