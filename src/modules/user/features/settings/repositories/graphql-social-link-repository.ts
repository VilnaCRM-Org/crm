import type {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CompleteSocialLinkMutation,
  InitiateSocialLinkMutation,
  LinkedSocialProvidersQuery,
  UnlinkSocialProviderMutation,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';

import type { SocialLinkCode } from '../types/social-link/outcome';

import COMPLETE_SOCIAL_LINK from './complete-social-link-mutation';
import INITIATE_SOCIAL_LINK from './initiate-social-link-mutation';
import LINKED_SOCIAL_PROVIDERS from './linked-social-providers-query';
import UNLINK_SOCIAL_PROVIDER from './unlink-social-provider-mutation';

@injectable()
export default class GraphQLSocialLinkRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public async list(signal: AbortSignal): Promise<LinkedSocialProvidersQuery> {
    const { data } = await this.apolloClient.query({
      query: LINKED_SOCIAL_PROVIDERS,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal }, queryDeduplication: false },
    });
    return data;
  }

  public initiate(
    provider: SocialLinkProviderId,
    signal: AbortSignal
  ): Promise<InitiateSocialLinkMutation | null> {
    return this.mutate(INITIATE_SOCIAL_LINK, { input: this.inputOf(provider) }, signal);
  }

  public complete(
    provider: SocialLinkProviderId,
    code: SocialLinkCode,
    signal: AbortSignal
  ): Promise<CompleteSocialLinkMutation | null> {
    const input = { ...this.inputOf(provider), ...code };
    return this.mutate(COMPLETE_SOCIAL_LINK, { input }, signal);
  }

  public unlink(
    provider: SocialLinkProviderId,
    signal: AbortSignal
  ): Promise<UnlinkSocialProviderMutation | null> {
    return this.mutate(UNLINK_SOCIAL_PROVIDER, { input: this.inputOf(provider) }, signal);
  }

  private inputOf(provider: SocialLinkProviderId): {
    provider: SocialLinkProviderId;
    clientMutationId: string;
  } {
    return { provider, clientMutationId: uuidv4() };
  }

  private async mutate<TData, TVariables extends OperationVariables>(
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    signal: AbortSignal
  ): Promise<TData | null> {
    const { data } = await this.apolloClient.mutate<TData, TVariables>({
      mutation,
      variables,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return data ?? null;
  }
}
