import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';

import type { AuthError } from '../types/auth-error';
import type { AuthRepository, LoginResult, RegisterResult } from '../types/auth-repository';
import type { AuthRepositoryDeps } from '../types/auth-repository-deps';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';

const ABORTED_ERROR: AuthError = {
  kind: 'network',
  displayMessage: '',
  retryable: false,
  aborted: true,
};

@injectable()
export default class AuthRepositoryImpl implements AuthRepository {
  constructor(@inject(TOKENS.AuthRepositoryDeps) private readonly deps: AuthRepositoryDeps) {}

  public async login(credentials: LoginUserDto, signal?: AbortSignal): Promise<LoginResult> {
    try {
      const apiResponse = await this.deps.loginAPI.login(credentials, { signal });
      const mapped = this.deps.loginResponseMapper.map(apiResponse, credentials.email);
      return mapped.ok
        ? { ok: true, value: { email: mapped.value.email, token: mapped.value.token } }
        : { ok: false, error: this.deps.authErrorFactory.fromUiError(mapped.error) };
    } catch (err) {
      return { ok: false, error: this.toError(err) };
    }
  }

  public async register(
    credentials: RegisterUserDto,
    signal?: AbortSignal
  ): Promise<RegisterResult> {
    try {
      const apiResponse = await this.deps.registrationAPI.register(credentials, { signal });
      const mapped = this.deps.registrationResponseMapper.map(apiResponse);
      return mapped.ok
        ? { ok: true, value: mapped.value }
        : { ok: false, error: this.deps.authErrorFactory.fromUiError(mapped.error) };
    } catch (err) {
      return { ok: false, error: this.toError(err) };
    }
  }

  private toError(err: unknown): AuthError {
    return this.deps.abortDetector.isAbortError(err)
      ? ABORTED_ERROR
      : this.deps.authErrorFactory.fromUiError(this.deps.authUiErrorMapper.map(err));
  }
}
