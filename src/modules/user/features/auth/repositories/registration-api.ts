import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { inject, injectable } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';

import type {
  CreateUserInput,
  CreateUserMutation,
  CreateUserMutationVariables,
} from '@/api/generated/graphql';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import { ApiError, ApiErrorCodes } from '@/modules/user/lib/api-errors';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import { HttpError } from '@/services/https-client/http-error';
import type { RegistrationResponse } from '@auth/types/api-responses';
import { CreateUserResultSchema } from '@auth/utils/response-schemas';

import type ApiErrorFactory from './api-error-factory';
import BaseAPI from './base-api';
import CREATE_USER from './create-user-mutation';
import type { RequestOptions } from './types';

const EMAIL_TAKEN_STATUS = 409;

@injectable()
export default class RegistrationAPI extends BaseAPI {
  constructor(
    @inject(AUTH_TOKENS.ApolloClient)
    private readonly apolloClient: ApolloClient<NormalizedCacheObject>,
    @inject(AUTH_TOKENS.ApiErrorFactory) apiErrorFactory: ApiErrorFactory,
    @inject(AUTH_TOKENS.UserServiceErrorTransformer)
    private readonly errors: UserServiceErrorTransformer
  ) {
    super(apiErrorFactory);
  }

  public async register(
    credentials: SignUpDto,
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
    credentials: SignUpDto,
    options?: RequestOptions
  ): Promise<{ data?: CreateUserMutation | null | undefined }> {
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

  private toCreateUserInput(credentials: SignUpDto): CreateUserInput {
    return {
      email: credentials.email,
      initials: credentials.fullName.trim(),
      password: credentials.password,
      clientMutationId: uuidv4(),
    };
  }

  private normalizeError(error: unknown): unknown {
    const status = this.isEmailTaken(error) ? EMAIL_TAKEN_STATUS : this.networkStatus(error);
    return typeof status === 'number'
      ? new HttpError({ status, message: 'Registration request failed', cause: error })
      : error;
  }

  private networkStatus(error: unknown): number | undefined {
    return (error as { networkError?: { statusCode?: number } }).networkError?.statusCode;
  }

  private isEmailTaken(error: unknown): boolean {
    const { violations } = this.errors.normalize(error);
    return violations.items.some(({ path, reason }) => path === 'email' && reason === 'taken');
  }
}
