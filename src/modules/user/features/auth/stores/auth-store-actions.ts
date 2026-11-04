import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import type { AuthError } from '@auth/types/auth-error';
import type { RegisterResult } from '@auth/types/auth-repository';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';

@injectable()
export default class AuthStoreActions {
  constructor(
    @inject(AUTH_TOKENS.AuthStoreActionsDeps) private readonly deps: AuthStoreActionsDeps
  ) {}

  public async register(credentials: SignUpDto, signal?: AbortSignal): Promise<void> {
    this.deps.authState.setState({ registerLoading: true, registerError: null, user: null });
    try {
      const result = await this.deps.repository.register(credentials, signal);
      this.applyRegister(result);
      this.deps.securitySignals.registerSettled(result);
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
    const message = error.message?.toLowerCase();
    const code = (error as { code?: unknown }).code;
    return (
      error.name === 'AbortError' ||
      code === 'ABORT_ERR' ||
      (message !== undefined && (message.includes('abort') || message.includes('cancel')))
    );
  }

  private toAuthError(error: unknown): AuthError {
    if (this.isAuthError(error)) return error;
    const normalized = this.deps.authRequestErrors.toUiError(error);
    return {
      kind: 'unknown',
      displayMessage: normalized.displayMessage,
      retryable: normalized.retryable,
    };
  }

  private applyRegister(result: RegisterResult): void {
    if (result.ok) {
      this.deps.authState.setState({
        registerLoading: false,
        user: result.value,
        registerError: null,
      });
      return;
    }
    if (result.error.aborted) {
      this.deps.authState.setState({ registerLoading: false });
      return;
    }
    this.deps.authState.setState({ registerLoading: false, registerError: result.error });
  }

  private applyRegisterRejection(error: unknown): void {
    if (this.isAborted(error)) {
      this.deps.authState.setState({ registerLoading: false });
      return;
    }
    this.deps.securitySignals.registerFailed(error);
    this.deps.authState.setState({
      registerLoading: false,
      registerError: this.toAuthError(error),
    });
  }
}
