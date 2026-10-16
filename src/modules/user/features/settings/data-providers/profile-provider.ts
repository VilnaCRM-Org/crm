import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';

import type GraphQLProfileRepository from '../repositories';
import type GraphQLProfileTransformer from '../transformers';
import type {
  ProfileChange,
  ProfileReadOutcome,
  ProfileResendOutcome,
  ProfileUpdateOutcome,
} from '../types/user-profile';

@injectable()
export default class ProfileProvider {
  constructor(
    @inject(AUTH_TOKENS.GraphQLProfileRepository)
    private readonly repository: GraphQLProfileRepository,
    @inject(AUTH_TOKENS.GraphQLProfileTransformer)
    private readonly transformer: GraphQLProfileTransformer,
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {}

  public async read(signal: AbortSignal): Promise<ProfileReadOutcome> {
    try {
      return this.transformer.toReadOutcome(await this.repository.read(signal));
    } catch (caught) {
      return this.transformer.failed(this.errors.normalize(caught, signal));
    }
  }

  public async update(change: ProfileChange, signal: AbortSignal): Promise<ProfileUpdateOutcome> {
    try {
      const input = this.transformer.toUpdateInput(change);
      return this.transformer.toUpdateOutcome(await this.repository.update(input, signal));
    } catch (caught) {
      const failure = this.errors.normalize(caught, signal);
      return this.transformer.invalid(failure) ?? this.transformer.failed(failure);
    }
  }

  public async resend(userId: string, signal: AbortSignal): Promise<ProfileResendOutcome> {
    try {
      return this.transformer.toResendOutcome(await this.repository.resend(userId, signal));
    } catch (caught) {
      return this.transformer.failed(this.errors.normalize(caught, signal));
    }
  }
}
