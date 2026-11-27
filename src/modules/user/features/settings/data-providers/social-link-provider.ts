import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';
import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type UnseenFailureReporter from '@/services/observability/unseen-failure-reporter';

import type { GraphQLSocialLinkRepository } from '../repositories';
import type { GraphQLSocialLinkTransformer } from '../transformers';
import type {
  SocialLinkChangeOutcome,
  SocialLinkCode,
  SocialLinkFailureOutcome,
  SocialLinksReadOutcome,
  SocialLinkStartOutcome,
} from '../types/social-link/outcome';

@injectable()
export default class SocialLinkProvider {
  constructor(
    @inject(AUTH_TOKENS.GraphQLSocialLinkRepository)
    private readonly repository: GraphQLSocialLinkRepository,
    @inject(AUTH_TOKENS.GraphQLSocialLinkTransformer)
    private readonly transformer: GraphQLSocialLinkTransformer,
    @inject(OBSERVABILITY_TOKENS.UnseenFailureReporter)
    private readonly unseenFailures: UnseenFailureReporter
  ) {}

  public async linked(signal: AbortSignal): Promise<SocialLinksReadOutcome> {
    try {
      return this.transformer.toLinked(await this.repository.list(signal));
    } catch (caught) {
      return this.transformer.toListFailure(this.failure(caught, signal, 'list'));
    }
  }

  public start(id: SocialLinkProviderId, signal: AbortSignal): Promise<SocialLinkStartOutcome> {
    return this.settle(
      async () => this.transformer.toStart(await this.repository.initiate(id, signal)),
      signal,
      'start'
    );
  }

  public complete(
    id: SocialLinkProviderId,
    code: SocialLinkCode,
    signal: AbortSignal
  ): Promise<SocialLinkChangeOutcome> {
    return this.settle(
      async () => this.transformer.toCompleted(await this.repository.complete(id, code, signal)),
      signal,
      'complete'
    );
  }

  public unlink(id: SocialLinkProviderId, signal: AbortSignal): Promise<SocialLinkChangeOutcome> {
    return this.settle(
      async () => this.transformer.toUnlinked(await this.repository.unlink(id, signal)),
      signal,
      'unlink'
    );
  }

  private async settle<TOutcome>(
    run: () => Promise<TOutcome>,
    signal: AbortSignal,
    stage: string
  ): Promise<TOutcome | SocialLinkFailureOutcome> {
    try {
      return await run();
    } catch (caught) {
      return this.transformer.toFailure(caught, this.failure(caught, signal, stage));
    }
  }

  private failure(caught: unknown, signal: AbortSignal, stage: string): UserServiceFailure {
    const failure = this.transformer.failure(caught, signal);
    if (failure.reason === 'unknown') {
      this.unseenFailures.report(caught, { source: 'settings:social-link', stage });
    }
    return failure;
  }
}
