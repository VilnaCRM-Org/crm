import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type { SignInUserMutation, SignInUserMutationVariables } from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';

import SIGN_IN_USER from './sign-in-user-mutation';

@injectable()
export default class GraphQLSignInRepository {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>
  ) {}

  public async signIn(dto: SignInDto, signal?: AbortSignal): Promise<SignInUserMutation | null> {
    if (signal?.aborted) {
      throw new DOMException('Sign-in request was aborted', 'AbortError');
    }
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
}
