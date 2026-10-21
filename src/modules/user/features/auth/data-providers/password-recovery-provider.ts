import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import type { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import type PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type {
  CreateNewPasswordOutcome,
  ResetPasswordOutcome,
} from '@auth/types/password-recovery/outcome';

@injectable()
export default class PasswordRecoveryProvider {
  constructor(
    @inject(AUTH_TOKENS.PasswordRecoveryRepository)
    private readonly repository: GraphQLPasswordRecoveryRepository,
    @inject(AUTH_TOKENS.PasswordRecoveryTransformer)
    private readonly transformer: PasswordRecoveryTransformer,
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {}

  public async requestReset(
    dto: RestorePasswordDto,
    signal: AbortSignal
  ): Promise<ResetPasswordOutcome> {
    try {
      await this.repository.requestReset(dto, signal);
      return this.transformer.toSentOutcome(dto);
    } catch (caught) {
      return this.transformer.fromFailure('request', this.errors.normalize(caught, signal));
    }
  }

  public async confirmReset(
    dto: CreateNewPasswordDto,
    signal: AbortSignal
  ): Promise<CreateNewPasswordOutcome> {
    try {
      await this.repository.confirmReset(dto, signal);
      return this.transformer.toConfirmedOutcome();
    } catch (caught) {
      return this.transformer.fromFailure('confirm', this.errors.normalize(caught, signal));
    }
  }
}
