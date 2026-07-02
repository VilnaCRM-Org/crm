import { inject, injectable } from 'tsyringe';

import API_ENDPOINTS from '@/config/api-config';
import TOKENS from '@/config/tokens';
import type { HttpsClient } from '@/services/types/https-client/https-client';

import type { LoginResponse } from '../types/api-responses';
import type { LoginUserDto } from '../types/credentials';
import { LoginResponseSchema } from '../utils/response-schemas';

import ApiErrorFactory from './api-error-factory';
import BaseAPI from './base-api';
import type { RequestOptions } from './types';

@injectable()
export default class LoginAPI extends BaseAPI {
  constructor(
    @inject(TOKENS.HttpsClient) private readonly httpsClient: HttpsClient,
    @inject(TOKENS.ApiErrorFactory) apiErrorFactory: ApiErrorFactory
  ) {
    super(apiErrorFactory);
  }

  public async login(
    credentials: LoginUserDto,
    options?: RequestOptions
  ): Promise<LoginResponse | undefined> {
    try {
      return await this.httpsClient.post<LoginUserDto, LoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials,
        {
          schema: LoginResponseSchema,
          signal: options?.signal,
        }
      );
    } catch (error) {
      throw this.handleApiError(error, 'Login');
    }
  }
}
