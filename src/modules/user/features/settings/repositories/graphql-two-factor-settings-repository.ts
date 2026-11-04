import type {
  ApolloClient,
  NormalizedCacheObject,
  OperationVariables,
  TypedDocumentNode,
} from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  ConfirmTwoFactorUserMutation,
  ConfirmTwoFactorUserMutationVariables,
  DisableTwoFactorUserMutation,
  DisableTwoFactorUserMutationVariables,
  RegenerateRecoveryCodesUserMutation,
  RegenerateRecoveryCodesUserMutationVariables,
  SetupTwoFactorUserMutation,
  SetupTwoFactorUserMutationVariables,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';

import CONFIRM_TWO_FACTOR_USER from './confirm-two-factor-user-mutation';
import DISABLE_TWO_FACTOR_USER from './disable-two-factor-user-mutation';
import REGENERATE_RECOVERY_CODES_USER from './regenerate-recovery-codes-user-mutation';
import SETUP_TWO_FACTOR_USER from './setup-two-factor-user-mutation';

@injectable()
export default class GraphQLTwoFactorSettingsRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public setup(signal: AbortSignal): Promise<SetupTwoFactorUserMutation | null> {
    return this.mutate<SetupTwoFactorUserMutation, SetupTwoFactorUserMutationVariables>(
      SETUP_TWO_FACTOR_USER,
      { input: { clientMutationId: uuidv4() } },
      signal
    );
  }

  public confirm(
    dto: TwoFactorDto,
    signal: AbortSignal
  ): Promise<ConfirmTwoFactorUserMutation | null> {
    return this.mutate<ConfirmTwoFactorUserMutation, ConfirmTwoFactorUserMutationVariables>(
      CONFIRM_TWO_FACTOR_USER,
      { input: { twoFactorCode: dto.twoFactorCode, clientMutationId: uuidv4() } },
      signal
    );
  }

  public disable(
    dto: TwoFactorDto,
    signal: AbortSignal
  ): Promise<DisableTwoFactorUserMutation | null> {
    return this.mutate<DisableTwoFactorUserMutation, DisableTwoFactorUserMutationVariables>(
      DISABLE_TWO_FACTOR_USER,
      { input: { twoFactorCode: dto.twoFactorCode, clientMutationId: uuidv4() } },
      signal
    );
  }

  public regenerate(signal: AbortSignal): Promise<RegenerateRecoveryCodesUserMutation | null> {
    return this.mutate<
      RegenerateRecoveryCodesUserMutation,
      RegenerateRecoveryCodesUserMutationVariables
    >(REGENERATE_RECOVERY_CODES_USER, { input: { clientMutationId: uuidv4() } }, signal);
  }

  private async mutate<TData, TVariables extends OperationVariables>(
    mutation: TypedDocumentNode<TData, TVariables>,
    variables: TVariables,
    signal: AbortSignal
  ): Promise<TData | null> {
    this.assertActive(signal);
    const { data } = await this.apolloClient.mutate<TData, TVariables>({
      mutation,
      variables,
      fetchPolicy: 'no-cache',
      context: { fetchOptions: { signal } },
    });
    return data ?? null;
  }

  private assertActive(signal: AbortSignal): void {
    if (signal.aborted) {
      throw new DOMException('Two-factor settings request was aborted', 'AbortError');
    }
  }
}
