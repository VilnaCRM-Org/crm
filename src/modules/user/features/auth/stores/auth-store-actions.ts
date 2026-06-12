import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthRepository, LoginResult, RegisterResult } from '@auth/types/auth-repository';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';
import { toUiError } from '@auth/utils/auth-request-errors';

import AuthStateVar from './auth-var';

@injectable()
export default class AuthStoreActions {
  constructor(@inject(TOKENS.AuthRepository) private readonly repository: AuthRepository) {}

  private static isAuthError(error: unknown): error is AuthError {
    if (typeof error !== 'object' || error === null) return false;
    const candidate = error as Partial<AuthError>;
    return (
      typeof candidate.kind === 'string' &&
      typeof candidate.displayMessage === 'string' &&
      typeof candidate.retryable === 'boolean'
    );
  }

  private static isAborted(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'aborted' in error &&
      (error as { aborted?: unknown }).aborted === true
    ) {
      return true;
    }
    if (!(error instanceof Error)) return false;
    const message = (error.message ?? '').toLowerCase();
    const code = (error as { code?: unknown }).code;
    return (
      error.name === 'AbortError' ||
      code === 'ABORT_ERR' ||
      message.includes('abort') ||
      message.includes('cancel')
    );
  }

  private static toAuthError(error: unknown): AuthError {
    if (AuthStoreActions.isAuthError(error)) return error;
    const normalized = toUiError(error);
    return {
      kind: 'unknown',
      displayMessage: normalized.displayMessage,
      retryable: normalized.retryable,
    };
  }

  private static applyLogin(result: LoginResult): void {
    if (result.ok) {
      AuthStateVar.set({
        loginLoading: false,
        email: result.value.email,
        token: result.value.token,
        loginError: null,
      });
      return;
    }
    if (result.error.aborted) {
      AuthStateVar.set({ loginLoading: false });
      return;
    }
    AuthStateVar.set({ loginLoading: false, loginError: result.error });
  }

  private static applyLoginRejection(error: unknown): void {
    if (AuthStoreActions.isAborted(error)) {
      AuthStateVar.set({ loginLoading: false });
      return;
    }
    AuthStateVar.set({ loginLoading: false, loginError: AuthStoreActions.toAuthError(error) });
  }

  private static applyRegister(result: RegisterResult): void {
    if (result.ok) {
      AuthStateVar.set({ registerLoading: false, user: result.value, registerError: null });
      return;
    }
    if (result.error.aborted) {
      AuthStateVar.set({ registerLoading: false });
      return;
    }
    AuthStateVar.set({ registerLoading: false, registerError: result.error });
  }

  private static applyRegisterRejection(error: unknown): void {
    if (AuthStoreActions.isAborted(error)) {
      AuthStateVar.set({ registerLoading: false });
      return;
    }
    AuthStateVar.set({
      registerLoading: false,
      registerError: AuthStoreActions.toAuthError(error),
    });
  }

  public async login(credentials: LoginUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ loginLoading: true, loginError: null });
    try {
      AuthStoreActions.applyLogin(await this.repository.login(credentials, signal));
    } catch (error) {
      AuthStoreActions.applyLoginRejection(error);
    }
  }

  public async register(credentials: RegisterUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ registerLoading: true, registerError: null, user: null });
    try {
      AuthStoreActions.applyRegister(await this.repository.register(credentials, signal));
    } catch (error) {
      AuthStoreActions.applyRegisterRejection(error);
    }
  }
}
