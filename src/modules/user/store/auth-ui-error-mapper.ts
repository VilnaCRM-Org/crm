import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { type UiError } from '@/services/error';
import AuthErrorHandler from '@auth/utils/auth-error-handler';

@injectable()
export default class AuthUiErrorMapper {
  constructor(
    @inject(TOKENS.AuthErrorHandler) private readonly authErrorHandler: AuthErrorHandler
  ) {}

  public map(error: unknown): UiError {
    return this.authErrorHandler.handle(error);
  }
}
