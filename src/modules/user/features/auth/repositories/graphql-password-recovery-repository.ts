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
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type UnseenFailureReporter from '@/services/observability/unseen-failure-reporter';
import type { RecoveryStep } from '@auth/types/password-recovery/outcome';

import CONFIRM_PASSWORD_RESET from './confirm-password-reset-mutation';
import REQUEST_PASSWORD_RESET from './request-password-reset-mutation';

@injectable()
export default class GraphQLPasswordRecoveryRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>,
    @inject(OBSERVABILITY_TOKENS.UnseenFailureReporter)
    private readonly unseenFailures: UnseenFailureReporter
  ) {}

  public async requestReset(dto: RestorePasswordDto, signal: AbortSignal): Promise<void> {
    const variables: RequestPasswordResetMutationVariables = {
      input: { email: dto.email, clientMutationId: uuidv4() },
    };
    try {
      await this.mutate<RequestPasswordResetMutation, RequestPasswordResetMutationVariables>(
        REQUEST_PASSWORD_RESET,
        variables,
        signal
      );
    } catch (caught) {
      throw this.reportUnseen('request', caught, signal);
    }
  }

  public async confirmReset(dto: CreateNewPasswordDto, signal: AbortSignal): Promise<void> {
    const variables: ConfirmPasswordResetMutationVariables = {
      input: { token: dto.token, newPassword: dto.newPassword, clientMutationId: uuidv4() },
    };
    try {
      await this.mutate<ConfirmPasswordResetMutation, ConfirmPasswordResetMutationVariables>(
        CONFIRM_PASSWORD_RESET,
        variables,
        signal
      );
    } catch (caught) {
      throw this.reportUnseen('confirm', caught, signal);
    }
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

  private reportUnseen(step: RecoveryStep, caught: unknown, signal: AbortSignal): unknown {
    if (!signal.aborted && !this.isAbortError(caught)) {
      this.unseenFailures.report(caught, { source: 'auth:password-recovery', stage: step });
    }
    return caught;
  }

  private isAbortError(caught: unknown): boolean {
    return (caught as { name?: unknown } | null)?.name === 'AbortError';
  }
}
