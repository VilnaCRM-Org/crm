import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { UiError } from '@/services/error';
import type { AuthErrorHandler } from '@auth';

@injectable()
export default class AuthUiErrorMapper {
  constructor(
    @inject(AUTH_TOKENS.AuthErrorHandler) private readonly authErrorHandler: AuthErrorHandler
  ) {}

  public map(error: unknown): UiError {
    return this.authErrorHandler.handle(error);
  }
}
