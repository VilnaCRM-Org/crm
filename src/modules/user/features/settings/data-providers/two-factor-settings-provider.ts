import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import type { GraphQLTwoFactorSettingsRepository } from '../repositories';
import type { GraphQLTwoFactorSettingsTransformer } from '../transformers';
import type { TwoFactorSettingsOutcome } from '../types/two-factor/outcome';

@injectable()
export default class TwoFactorSettingsProvider {
  constructor(
    @inject(AUTH_TOKENS.GraphQLTwoFactorSettingsRepository)
    private readonly repository: GraphQLTwoFactorSettingsRepository,
    @inject(AUTH_TOKENS.GraphQLTwoFactorSettingsTransformer)
    private readonly transformer: GraphQLTwoFactorSettingsTransformer,
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {}

  public setup(signal: AbortSignal): Promise<TwoFactorSettingsOutcome> {
    return this.settle(
      async () => this.transformer.toSetupOutcome(await this.repository.setup(signal)),
      signal
    );
  }

  public confirm(dto: TwoFactorDto, signal: AbortSignal): Promise<TwoFactorSettingsOutcome> {
    return this.settle(
      async () => this.transformer.toConfirmOutcome(await this.repository.confirm(dto, signal)),
      signal
    );
  }

  public disable(dto: TwoFactorDto, signal: AbortSignal): Promise<TwoFactorSettingsOutcome> {
    return this.settle(
      async () => this.transformer.toDisableOutcome(await this.repository.disable(dto, signal)),
      signal
    );
  }

  public regenerate(signal: AbortSignal): Promise<TwoFactorSettingsOutcome> {
    return this.settle(
      async () => this.transformer.toRegenerateOutcome(await this.repository.regenerate(signal)),
      signal
    );
  }

  private async settle(
    run: () => Promise<TwoFactorSettingsOutcome>,
    signal: AbortSignal
  ): Promise<TwoFactorSettingsOutcome> {
    try {
      return await run();
    } catch (caught) {
      return this.transformer.toFailure(this.errors.normalize(caught, signal));
    }
  }
}
