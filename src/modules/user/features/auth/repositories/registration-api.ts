import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CreateUserInput,
  CreateUserMutation,
  CreateUserMutationVariables,
} from '@/api/generated/graphql';
import TOKENS from '@/config/tokens';
import { ApiError, ApiErrorCodes } from '@/modules/user/lib/api-errors';
import { HttpError } from '@/services/https-client/http-error';
import type { RegistrationResponse } from '@auth/types/api-responses';
import type { RegisterUserDto } from '@auth/types/credentials';
import { CreateUserResultSchema } from '@auth/utils/response-schemas';

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
      const { data } = await this.mutateCreateUser(credentials, options);
      return this.toRegistrationResponse(data);
    } catch (error) {
      if (options?.signal?.aborted) {
        // Normalize to an AbortError so the store's abort detection stays transport-agnostic.
        throw this.abortError();
      }
      throw this.handleApiError(this.normalizeError(error), 'Registration');
    }
  }

  private mutateCreateUser(
    credentials: RegisterUserDto,
    options?: RequestOptions
  ): Promise<{ data?: CreateUserMutation | null }> {
    return this.apolloClient.mutate<CreateUserMutation, CreateUserMutationVariables>({
      mutation: CREATE_USER,
      variables: { input: this.toCreateUserInput(credentials) },
      context: { fetchOptions: { signal: options?.signal } },
    });
  }

  private toRegistrationResponse(data: unknown): RegistrationResponse | undefined {
    const parsed = CreateUserResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: 'Registration response did not match the expected contract.',
        code: ApiErrorCodes.VALIDATION,
      });
    }

    const user = parsed.data?.createUser?.user;
    return user ? { email: user.email, fullName: user.initials } : undefined;
  }

  private abortError(): Error {
    const abortError = new Error('Registration request was aborted');
    abortError.name = 'AbortError';
    return abortError;
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
