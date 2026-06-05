import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';

import type { AuthError } from '../types/auth-error';
import type { AuthRepository, LoginResult, RegisterResult } from '../types/auth-repository';
import type { AuthSetState } from '../types/auth-store';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';
import { toUiError } from '../utils/auth-request-errors';

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

  private static applyLogin(set: AuthSetState, result: LoginResult): void {
    if (result.ok) {
      set(
        {
          loginLoading: false,
          email: result.value.email,
          token: result.value.token,
          loginError: null,
        },
        false,
        'auth/loginUser/fulfilled'
      );
      return;
    }
    if (result.error.aborted) {
      set({ loginLoading: false }, false, 'auth/loginUser/aborted');
      return;
    }
    set({ loginLoading: false, loginError: result.error }, false, 'auth/loginUser/rejected');
  }

  private static applyLoginRejection(set: AuthSetState, error: unknown): void {
    if (AuthStoreActions.isAborted(error)) {
      set({ loginLoading: false }, false, 'auth/loginUser/aborted');
      return;
    }
    set(
      { loginLoading: false, loginError: AuthStoreActions.toAuthError(error) },
      false,
      'auth/loginUser/rejected'
    );
  }

  private static applyRegister(set: AuthSetState, result: RegisterResult): void {
    if (result.ok) {
      set(
        { registerLoading: false, user: result.value, registerError: null },
        false,
        'auth/registerUser/fulfilled'
      );
      return;
    }
    if (result.error.aborted) {
      set({ registerLoading: false }, false, 'auth/registerUser/aborted');
      return;
    }
    set(
      { registerLoading: false, registerError: result.error },
      false,
      'auth/registerUser/rejected'
    );
  }

  private static applyRegisterRejection(set: AuthSetState, error: unknown): void {
    if (AuthStoreActions.isAborted(error)) {
      set({ registerLoading: false }, false, 'auth/registerUser/aborted');
      return;
    }
    set(
      { registerLoading: false, registerError: AuthStoreActions.toAuthError(error) },
      false,
      'auth/registerUser/rejected'
    );
  }

  public async login(
    set: AuthSetState,
    credentials: LoginUserDto,
    signal?: AbortSignal
  ): Promise<void> {
    set({ loginLoading: true, loginError: null }, false, 'auth/loginUser/pending');
    try {
      AuthStoreActions.applyLogin(set, await this.repository.login(credentials, signal));
    } catch (error) {
      AuthStoreActions.applyLoginRejection(set, error);
    }
  }

  public async register(
    set: AuthSetState,
    credentials: RegisterUserDto,
    signal?: AbortSignal
  ): Promise<void> {
    set(
      { registerLoading: true, registerError: null, user: null },
      false,
      'auth/registerUser/pending'
    );
    try {
      AuthStoreActions.applyRegister(set, await this.repository.register(credentials, signal));
    } catch (error) {
      AuthStoreActions.applyRegisterRejection(set, error);
    }
  }
}
