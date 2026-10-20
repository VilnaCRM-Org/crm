import type {
  ApolloClient,
  ApolloError,
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
import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { CreateNewPasswordDto } from '@/modules/user/types/user/create-new-password-dto';
import type { RestorePasswordDto } from '@/modules/user/types/user/restore-password-dto';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type { RecoveryStep } from '@auth/types/password-recovery/outcome';

import CONFIRM_PASSWORD_RESET from './confirm-password-reset-mutation';
import REQUEST_PASSWORD_RESET from './request-password-reset-mutation';

@injectable()
export default class GraphQLPasswordRecoveryRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>,
    @inject(AUTH_TOKENS.SandboxDemoSessionProvider)
    private readonly sandboxDemo: SandboxDemoSessionProvider,
    @inject(OBSERVABILITY_TOKENS.ObservabilityService)
    private readonly observability: ObservabilityService
  ) {}

  public async requestReset(dto: RestorePasswordDto, signal: AbortSignal): Promise<void> {
    if (!signal.aborted && this.sandboxDemo.resetTokenFor(dto.email) !== null) return;
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
    if (!signal.aborted && this.sandboxDemo.acceptsResetToken(dto.token)) return;
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
    if (!signal.aborted && !this.isAbortError(caught) && !this.reachedTheLink(caught)) {
      this.observability.captureError(caught, { source: 'auth:password-recovery', stage: step });
    }
    return caught;
  }

  private reachedTheLink(caught: unknown): boolean {
    const { networkError, graphQLErrors } = (caught ?? {}) as Partial<ApolloError>;
    return Boolean(networkError) || (graphQLErrors?.length ?? 0) > 0;
  }

  private isAbortError(caught: unknown): boolean {
    return (caught as { name?: unknown } | null)?.name === 'AbortError';
  }
}
