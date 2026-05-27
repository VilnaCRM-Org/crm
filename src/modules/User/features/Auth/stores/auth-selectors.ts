import type { SafeUserInfo } from '@auth/types/ApiResponses';

import type { AuthStore } from './auth-types';

export const selectEmail = (state: AuthStore): string => state.email;
export const selectToken = (state: AuthStore): string | null => state.token;
export const selectIsAuthenticated = (state: AuthStore): boolean => !!state.token;
export const selectLoginLoading = (state: AuthStore): boolean => state.loginLoading;
export const selectLoginError = (state: AuthStore): string | null => state.loginError;
export const selectRegisterLoading = (state: AuthStore): boolean => state.registerLoading;
export const selectRegisterError = (state: AuthStore): string | null => state.registerError;
export const selectRegisterUser = (state: AuthStore): SafeUserInfo | null => state.user;
export const selectRegisterRetryable = (state: AuthStore): boolean | undefined =>
  state.registerRetryable;
