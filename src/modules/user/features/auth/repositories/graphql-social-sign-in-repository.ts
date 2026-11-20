import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CompleteSocialSignInMutation,
  CompleteSocialSignInMutationVariables,
  InitiateSocialSignInMutation,
  InitiateSocialSignInMutationVariables,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import type { SocialCallbackParams } from '@auth/types/social-sign-in/social-sign-in-outcome';
import type {
  SocialCompletion,
  SocialInitiation,
} from '@auth/types/social-sign-in/social-sign-in-result';
import {
  SocialCompleteResultSchema,
  SocialInitiateResultSchema,
} from '@auth/utils/response-schemas';

import COMPLETE_SOCIAL_SIGN_IN from './complete-social-sign-in-mutation';
import INITIATE_SOCIAL_SIGN_IN from './initiate-social-sign-in-mutation';

// The two social sign-in mutations. Neither is ever retried: a state is issued once and a
// provider code is single-use, so a repeat could only fail with invalid_state.
@injectable()
export default class GraphQLSocialSignInRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public async initiate(provider: SocialProvider, signal: AbortSignal): Promise<SocialInitiation> {
    const { data } = await this.apolloClient.mutate<
      InitiateSocialSignInMutation,
      InitiateSocialSignInMutationVariables
    >({
      mutation: INITIATE_SOCIAL_SIGN_IN,
      variables: { input: { provider, clientMutationId: uuidv4() } },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return SocialInitiateResultSchema.parse(data).initiateSocialSignInUser.user;
  }

  public async complete(
    provider: SocialProvider,
    params: SocialCallbackParams,
    signal: AbortSignal
  ): Promise<SocialCompletion> {
    const { data } = await this.apolloClient.mutate<
      CompleteSocialSignInMutation,
      CompleteSocialSignInMutationVariables
    >({
      mutation: COMPLETE_SOCIAL_SIGN_IN,
      variables: { input: { provider, ...params, clientMutationId: uuidv4() } },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return SocialCompleteResultSchema.parse(data).completeSocialSignInUser.user;
  }
}
