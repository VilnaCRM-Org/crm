import type {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  ConfirmPasswordResetMutation,
  ConfirmPasswordResetMutationVariables,
  RequestPasswordResetMutation,
  RequestPasswordResetMutationVariables,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';

import CONFIRM_PASSWORD_RESET from './confirm-password-reset-mutation';
import REQUEST_PASSWORD_RESET from './request-password-reset-mutation';

@injectable()
export default class GraphQLPasswordRecoveryRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public requestReset(dto: RestorePasswordDto, signal: AbortSignal): Promise<void> {
    const variables: RequestPasswordResetMutationVariables = {
      input: { email: dto.email, clientMutationId: uuidv4() },
    };
    return this.mutate<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>(
      REQUEST_PASSWORD_RESET,
      variables,
      signal
    );
  }

  public confirmReset(dto: CreateNewPasswordDto, signal: AbortSignal): Promise<void> {
    const variables: ConfirmPasswordResetMutationVariables = {
      input: { token: dto.token, newPassword: dto.newPassword, clientMutationId: uuidv4() },
    };
    return this.mutate<ConfirmPasswordResetMutation, ConfirmPasswordResetMutationVariables>(
      CONFIRM_PASSWORD_RESET,
      variables,
      signal
    );
  }

  private async mutate<TData, TVariables extends OperationVariables>(
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted) {
      throw new DOMException('Password recovery request was aborted', 'AbortError');
    }
    await this.apolloClient.mutate<TData, TVariables>({
      mutation,
      variables,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
  }
}
