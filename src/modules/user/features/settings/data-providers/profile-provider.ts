import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type UnseenFailureReporter from '@/services/observability/unseen-failure-reporter';

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
    @inject(OBSERVABILITY_TOKENS.UnseenFailureReporter)
    private readonly unseenFailures: UnseenFailureReporter
  ) {}

  public async read(signal: AbortSignal): Promise<ProfileReadOutcome> {
    try {
      return this.transformer.toReadOutcome(await this.repository.read(signal));
    } catch (caught) {
      return this.transformer.failed(this.failure(caught, signal, 'read'));
    }
  }

  public async update(change: ProfileChange, signal: AbortSignal): Promise<ProfileUpdateOutcome> {
    try {
      const input = this.transformer.toUpdateInput(change);
      return this.transformer.toUpdateOutcome(await this.repository.update(input, signal));
    } catch (caught) {
      const failure = this.failure(caught, signal, 'update');
      return this.transformer.invalid(failure) ?? this.transformer.failed(failure);
    }
  }

  public async resend(userId: string, signal: AbortSignal): Promise<ProfileResendOutcome> {
    try {
      return this.transformer.toResendOutcome(await this.repository.resend(userId, signal));
    } catch (caught) {
      return this.transformer.failed(this.failure(caught, signal, 'resend'));
    }
  }

  private failure(caught: unknown, signal: AbortSignal, stage: string): UserServiceFailure {
    const failure = this.transformer.failure(caught, signal);
    if (failure.reason === 'unknown') {
      this.unseenFailures.report(caught, { source: 'settings:profile', stage });
    }
    return failure;
  }
}
