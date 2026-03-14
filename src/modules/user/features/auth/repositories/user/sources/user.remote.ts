import API_ENDPOINTS from '@/config/api-config';
import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/https-client/https-client';
import { ApolloClient, NormalizedCacheObject, ApolloError } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import { handleApiError } from '@/modules/user/lib/errors';

import type { LoginResponse } from '../../../types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '../../../types/credentials';
import CREATE_USER from '../../../types/graphql/mutations';
import type { CreateUserInput, CreateUserResponse } from '../../../types/graphql/types';
import type { LoginResult, CreateUserResult } from '../user-repository.types';

/**
 * Remote data source for user operations
 * Handles both REST and GraphQL API calls
 */
@injectable()
export default class UserRemoteSource {
  private readonly httpsClient: HttpsClient;

  private readonly apolloClient: ApolloClient<NormalizedCacheObject>;

  constructor(
    @inject(TOKENS.HttpsClient) httpsClient: HttpsClient,
    @inject(TOKENS.ApolloClient) apolloClient: ApolloClient<NormalizedCacheObject>
  ) {
    this.httpsClient = httpsClient;
    this.apolloClient = apolloClient;
  }

  /**
   * Login user via REST API
   */
  public async login(
    credentials: LoginUserDto,
    options?: { signal?: AbortSignal }
  ): Promise<LoginResult> {
    try {
      const response = await this.httpsClient.post<LoginUserDto, LoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials,
        options
      );
      return {
        token: response.token,
        email: credentials.email.toLowerCase(),
      };
    } catch (error) {
      throw handleApiError(error, 'Login');
    }
  }

  /**
   * Create user via GraphQL API
   */
  public async createUser(credentials: RegisterUserDto): Promise<CreateUserResult> {
    const variables: { input: CreateUserInput } = {
      input: {
        email: credentials.email,
        initials: credentials.fullName.trim(),
        password: credentials.password,
        clientMutationId: uuidv4(),
      },
    };

    const { data } = await this.apolloClient.mutate<CreateUserResponse>({
      mutation: CREATE_USER,
      variables,
    });

    if (!data?.createUser?.user) {
      throw new ApolloError({ errorMessage: 'Failed to create user' });
    }

    return {
      id: data.createUser.user.id,
      email: data.createUser.user.email,
    };
  }
}
