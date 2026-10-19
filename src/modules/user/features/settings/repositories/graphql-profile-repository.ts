import type {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CurrentUserQuery,
  ResendEmailToUserMutation,
  ResendEmailToUserMutationVariables,
  UpdateUserInput,
  UpdateUserMutation,
  UpdateUserMutationVariables,
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

  public update(
    input: UpdateUserInput,
    signal: AbortSignal
  ): Promise<UpdateUserMutation | null | undefined> {
    return this.mutate<UpdateUserMutation, UpdateUserMutationVariables>(
      UPDATE_USER,
      { input: { ...input, clientMutationId: uuidv4() } },
      signal
    );
  }

  public resend(
    userId: string,
    signal: AbortSignal
  ): Promise<ResendEmailToUserMutation | null | undefined> {
    return this.mutate<ResendEmailToUserMutation, ResendEmailToUserMutationVariables>(
      RESEND_EMAIL_TO_USER,
      { input: { id: userId, clientMutationId: uuidv4() } },
      signal
    );
  }

  private async mutate<TData, TVariables extends OperationVariables>(
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    signal: AbortSignal
  ): Promise<TData | null | undefined> {
    this.assertActive(signal);
    const { data } = await this.apolloClient.mutate<TData, TVariables>({
      mutation,
      variables,
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
