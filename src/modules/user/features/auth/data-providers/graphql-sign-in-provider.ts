import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { GraphQLSignInRepository } from '@auth/repositories';
import type GraphQLSignInTransformer from '@auth/transformers/graphql-sign-in-transformer';
import type { ChallengeResult, TwoFactorChallengeInput } from '@auth/types/two-factor/challenge';
import type { SignInResult } from '@auth/types/two-factor/sign-in';

@injectable()
export default class GraphQLSignInProvider {
  constructor(
    @inject(AUTH_TOKENS.GraphQLSignInRepository)
    private readonly repository: GraphQLSignInRepository,
    @inject(AUTH_TOKENS.GraphQLSignInTransformer)
    private readonly transformer: GraphQLSignInTransformer,
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {}

  public async login(dto: SignInDto, signal?: AbortSignal): Promise<SignInResult> {
    try {
      const payload = await this.repository.signIn(dto, signal);
      return this.transformer.toSignInResult(payload, dto);
    } catch (caught) {
      return this.transformer.toSignInFailure(this.errors.normalize(caught, signal));
    }
  }

  public async completeChallenge(
    challenge: TwoFactorChallengeInput,
    signal?: AbortSignal
  ): Promise<ChallengeResult> {
    try {
      const payload = await this.repository.completeChallenge(challenge, signal);
      return this.transformer.toChallengeResult(payload);
    } catch (caught) {
      return this.transformer.toChallengeFailure(this.errors.normalize(caught, signal));
    }
  }
}
