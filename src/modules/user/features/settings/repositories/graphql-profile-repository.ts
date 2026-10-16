import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CurrentUserQuery,
  ResendEmailToUserMutation,
  UpdateUserInput,
  UpdateUserMutation,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';

import CURRENT_USER from './current-user-query';
import RESEND_EMAIL_TO_USER from './resend-email-to-user-mutation';
import UPDATE_USER from './update-user-mutation';

@injectable()
export default class GraphQLProfileRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public async read(signal: AbortSignal): Promise<CurrentUserQuery | null | undefined> {
    this.assertActive(signal);
    const { data } = await this.apolloClient.query({
      query: CURRENT_USER,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal }, queryDeduplication: false },
    });
    return data;
  }

  public async update(
    input: UpdateUserInput,
    signal: AbortSignal
  ): Promise<UpdateUserMutation | null | undefined> {
    this.assertActive(signal);
    const { data } = await this.apolloClient.mutate({
      mutation: UPDATE_USER,
      variables: { input: { ...input, clientMutationId: uuidv4() } },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return data;
  }

  public async resend(
    userId: string,
    signal: AbortSignal
  ): Promise<ResendEmailToUserMutation | null | undefined> {
    this.assertActive(signal);
    const { data } = await this.apolloClient.mutate({
      mutation: RESEND_EMAIL_TO_USER,
      variables: { input: { id: userId, clientMutationId: uuidv4() } },
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return data;
  }

  private assertActive(signal: AbortSignal): void {
    if (signal.aborted) {
      throw new DOMException('Profile request was aborted', 'AbortError');
    }
  }
}
