import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import TOKENS from '@/config/tokens';
import { HttpError } from '@/services/https-client/http-error';
import type { RegisterUserDto } from '@auth/types/credentials';

import type { RegistrationResponse } from '../types/api-responses';
import type { CreateUserInput, CreateUserResponse } from '../types/graphql/types';

import ApiErrorFactory from './api-error-factory';
import BaseAPI from './base-api';
import CREATE_USER from './create-user-mutation';
import type { RequestOptions } from './types';

@injectable()
export default class RegistrationAPI extends BaseAPI {
  constructor(
    @inject(TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>,
    @inject(TOKENS.ApiErrorFactory) apiErrorFactory: ApiErrorFactory
  ) {
    super(apiErrorFactory);
  }

  public async register(
    credentials: RegisterUserDto,
    options?: RequestOptions
  ): Promise<RegistrationResponse | undefined> {
    try {
      const { data } = await this.apolloClient.mutate<
        CreateUserResponse,
        { input: CreateUserInput }
      >({
        mutation: CREATE_USER,
        variables: { input: this.toCreateUserInput(credentials) },
        context: { fetchOptions: { signal: options?.signal } },
      });

      const user = data?.createUser?.user;
      return user ? { email: user.email, fullName: user.initials } : undefined;
    } catch (error) {
      if (options?.signal?.aborted) {
        // Normalize to an AbortError so the store's abort detection stays transport-agnostic.
        const abortError = new Error('Registration request was aborted');
        abortError.name = 'AbortError';
        throw abortError;
      }
      throw this.handleApiError(this.normalizeError(error), 'Registration');
    }
  }

  private toCreateUserInput(credentials: RegisterUserDto): CreateUserInput {
    return {
      email: credentials.email,
      initials: credentials.fullName.trim(),
      password: credentials.password,
      clientMutationId: uuidv4(),
    };
  }

  private httpStatusOf(error: unknown): number | undefined {
    const networkError = (error as { networkError?: { statusCode?: number } }).networkError;
    const status = networkError?.statusCode;
    return typeof status === 'number' ? status : undefined;
  }

  private normalizeError(error: unknown): unknown {
    const status = this.httpStatusOf(error);
    return typeof status === 'number'
      ? new HttpError({ status, message: 'Registration request failed', cause: error })
      : error;
  }
}
