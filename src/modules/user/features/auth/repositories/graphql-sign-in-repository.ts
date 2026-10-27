import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CompleteTwoFactorUserMutation,
  CompleteTwoFactorUserMutationVariables,
  SignInUserMutation,
  SignInUserMutationVariables,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { TwoFactorChallengeInput } from '@auth/types/two-factor/challenge';

import COMPLETE_TWO_FACTOR_USER from './complete-two-factor-user-mutation';
import SIGN_IN_USER from './sign-in-user-mutation';

@injectable()
export default class GraphQLSignInRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public async signIn(dto: SignInDto, signal?: AbortSignal): Promise<SignInUserMutation | null> {
    this.assertNotAborted(signal);
    const variables: SignInUserMutationVariables = {
      input: { email: dto.email, password: dto.password, clientMutationId: uuidv4() },
    };
    const result = await this.apolloClient.mutate<SignInUserMutation, SignInUserMutationVariables>({
      mutation: SIGN_IN_USER,
      variables,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return result.data ?? null;
  }

  public async completeChallenge(
    challenge: TwoFactorChallengeInput,
    signal?: AbortSignal
  ): Promise<CompleteTwoFactorUserMutation | null> {
    this.assertNotAborted(signal);
    const variables: CompleteTwoFactorUserMutationVariables = {
      input: {
        pendingSessionId: challenge.pendingSessionId,
        twoFactorCode: challenge.twoFactorCode,
        clientMutationId: uuidv4(),
      },
    };
    const result = await this.apolloClient.mutate<
      CompleteTwoFactorUserMutation,
      CompleteTwoFactorUserMutationVariables
    >({
      mutation: COMPLETE_TWO_FACTOR_USER,
      variables,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return result.data ?? null;
  }

  private assertNotAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) {
      throw new DOMException('Sign-in request was aborted', 'AbortError');
    }
  }
}
