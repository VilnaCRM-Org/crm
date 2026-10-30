import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';

import type { AuthError } from '../types/auth-error';
import type { AuthRepository, RegisterResult } from '../types/auth-repository';
import type { AuthRepositoryDeps } from '../types/auth-repository-deps';

const ABORTED_ERROR: AuthError = {
  kind: 'network',
  displayMessage: '',
  retryable: false,
  aborted: true,
};

@injectable()
export default class AuthRepositoryImpl implements AuthRepository {
  constructor(@inject(AUTH_TOKENS.AuthRepositoryDeps) private readonly deps: AuthRepositoryDeps) {}

  public async register(credentials: SignUpDto, signal?: AbortSignal): Promise<RegisterResult> {
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
      : this.deps.authErrorFactory.fromUiError(this.deps.authUiErrorMapper.map(err), err);
  }
}
