import type { SafeUserInfo } from '../types/api-responses';
import type { AuthError } from '../types/auth-error';
import type { AuthStore } from '../types/auth-store';

export default class AuthStoreSelectors {
  public static email(state: AuthStore): string {
    return state.email;
  }

  public static token(state: AuthStore): string | null {
    return state.token;
  }

  public static isAuthenticated(state: AuthStore): boolean {
    return !!state.token;
  }

  public static loginLoading(state: AuthStore): boolean {
    return state.loginLoading;
  }

  public static loginError(state: AuthStore): AuthError | null {
    return state.loginError;
  }

  public static registerLoading(state: AuthStore): boolean {
    return state.registerLoading;
  }

  public static registerError(state: AuthStore): AuthError | null {
    return state.registerError;
  }

  public static registerUser(state: AuthStore): SafeUserInfo | null {
    return state.user;
  }

  public static registerRetryable(state: AuthStore): boolean | undefined {
    return state.registerError?.retryable;
  }
}
