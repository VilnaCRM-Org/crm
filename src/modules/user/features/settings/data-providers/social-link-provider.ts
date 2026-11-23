import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';

import type { GraphQLSocialLinkRepository } from '../repositories';
import type { GraphQLSocialLinkTransformer } from '../transformers';
import type {
  LinkedProviderSet,
  SocialLinkChangeOutcome,
  SocialLinkCode,
  SocialLinkFailureOutcome,
  SocialLinkStartOutcome,
} from '../types/social-link/outcome';

@injectable()
export default class SocialLinkProvider {
  constructor(
    @inject(AUTH_TOKENS.GraphQLSocialLinkRepository)
    private readonly repository: GraphQLSocialLinkRepository,
    @inject(AUTH_TOKENS.GraphQLSocialLinkTransformer)
    private readonly transformer: GraphQLSocialLinkTransformer,
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {}

  public async linked(signal: AbortSignal): Promise<LinkedProviderSet | null> {
    try {
      return this.transformer.toLinked(await this.repository.list(signal));
    } catch {
      return null;
    }
  }

  public start(id: SocialLinkProviderId, signal: AbortSignal): Promise<SocialLinkStartOutcome> {
    return this.settle(
      async () => this.transformer.toStart(await this.repository.initiate(id, signal)),
      signal
    );
  }

  public complete(
    id: SocialLinkProviderId,
    code: SocialLinkCode,
    signal: AbortSignal
  ): Promise<SocialLinkChangeOutcome> {
    return this.settle(
      async () => this.transformer.toCompleted(await this.repository.complete(id, code, signal)),
      signal
    );
  }

  public unlink(id: SocialLinkProviderId, signal: AbortSignal): Promise<SocialLinkChangeOutcome> {
    return this.settle(
      async () => this.transformer.toUnlinked(await this.repository.unlink(id, signal)),
      signal
    );
  }

  private async settle<TOutcome>(
    run: () => Promise<TOutcome>,
    signal: AbortSignal
  ): Promise<TOutcome | SocialLinkFailureOutcome> {
    try {
      return await run();
    } catch (caught) {
      return this.transformer.toFailure(caught, this.errors.normalize(caught, signal));
    }
  }
}
