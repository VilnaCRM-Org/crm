import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import type { AuthError } from '@auth/types/auth-error';
import type { AuthRepository, LoginResult, RegisterResult } from '@auth/types/auth-repository';
import type { LoginUserDto, RegisterUserDto } from '@auth/types/credentials';
import AuthRequestErrors from '@auth/utils/auth-request-errors';

import AuthStateVar from './auth-var';

@injectable()
export default class AuthStoreActions {
  constructor(
    @inject(TOKENS.AuthRepository) private readonly repository: AuthRepository,
    @inject(TOKENS.AuthRequestErrors) private readonly authRequestErrors: AuthRequestErrors
  ) {}

  public async login(credentials: LoginUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ loginLoading: true, loginError: null });
    try {
      this.applyLogin(await this.repository.login(credentials, signal));
    } catch (error) {
      this.applyLoginRejection(error);
    }
  }

  public async register(credentials: RegisterUserDto, signal?: AbortSignal): Promise<void> {
    AuthStateVar.set({ registerLoading: true, registerError: null, user: null });
    try {
      this.applyRegister(await this.repository.register(credentials, signal));
    } catch (error) {
      this.applyRegisterRejection(error);
    }
  }

  private isAuthError(error: unknown): error is AuthError {
    if (typeof error !== 'object' || error === null) return false;
    const candidate = error as Partial<AuthError>;
    return (
      typeof candidate.kind === 'string' &&
      typeof candidate.displayMessage === 'string' &&
      typeof candidate.retryable === 'boolean'
    );
  }

  private isAborted(error: unknown): boolean {
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

  private toAuthError(error: unknown): AuthError {
    if (this.isAuthError(error)) return error;
    const normalized = this.authRequestErrors.toUiError(error);
    return {
      kind: 'unknown',
      displayMessage: normalized.displayMessage,
      retryable: normalized.retryable,
    };
  }

  private applyLogin(result: LoginResult): void {
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

  private applyLoginRejection(error: unknown): void {
    if (this.isAborted(error)) {
      AuthStateVar.set({ loginLoading: false });
      return;
    }
    AuthStateVar.set({ loginLoading: false, loginError: this.toAuthError(error) });
  }

  private applyRegister(result: RegisterResult): void {
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

  private applyRegisterRejection(error: unknown): void {
    if (this.isAborted(error)) {
      AuthStateVar.set({ registerLoading: false });
      return;
    }
    AuthStateVar.set({
      registerLoading: false,
      registerError: this.toAuthError(error),
    });
  }
}
