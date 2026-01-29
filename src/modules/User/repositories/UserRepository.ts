import TOKENS from '@/config/tokens';
import type ApolloClientService from '@/services/ApolloClient/ApolloClientService';
import { ApolloError } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';


import CREATE_USER from '../features/Auth/api/graphql/mutations';
import type { CreateUserInput, CreateUserResponse } from '../features/Auth/api/graphql/types';
import type LoginAPI from '../features/Auth/api/LoginAPI';
import type { LoginUserDto, RegisterUserDto } from '../features/Auth/types/Credentials';

import type { IUserRepository, LoginResult, CreateUserResult } from './IUserRepository';

@injectable()
export default class UserRepository implements IUserRepository {
  private readonly loginAPI: LoginAPI;

  private readonly apolloClientService: ApolloClientService;

  constructor(
    @inject(TOKENS.LoginAPI) loginAPI: LoginAPI,
    @inject(TOKENS.ApolloClientService) apolloClientService: ApolloClientService
  ) {
    this.loginAPI = loginAPI;
    this.apolloClientService = apolloClientService;
  }

  public async login(
    credentials: LoginUserDto,
    options?: { signal?: AbortSignal }
  ): Promise<LoginResult> {
    const response = await this.loginAPI.login(credentials, options);
    return {
      token: response.token,
      email: credentials.email.toLowerCase(),
    };
  }

  public async createUser(credentials: RegisterUserDto): Promise<CreateUserResult> {
    const client = this.apolloClientService.getClient();
    const variables: { input: CreateUserInput } = {
      input: {
        email: credentials.email,
        initials: credentials.fullName.trim(),
        password: credentials.password,
        clientMutationId: uuidv4(),
      },
    };

    const { data } = await client.mutate<CreateUserResponse>({
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
