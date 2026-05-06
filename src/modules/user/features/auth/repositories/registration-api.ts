import API_ENDPOINTS from '@/config/api-config';
import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/https-client/https-client';
import { inject, injectable } from 'tsyringe';

import type { RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

import type { RegistrationResponse } from '../types/api-responses';

import BaseAPI from './base-api';
import { RequestOptions } from './types';

@injectable()
export default class RegistrationAPI extends BaseAPI {
  constructor(@inject(TOKENS.HttpsClient) private readonly httpsClient: HttpsClient) {
    super();
  }

  public async register(
    credentials: RegisterUserDto,
    options?: RequestOptions
  ): Promise<RegistrationResponse> {
    try {
      return await this.httpsClient.post<RegisterUserDto, RegistrationResponse>(
        API_ENDPOINTS.REGISTER,
        credentials,
        options
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Let RTK detect the abort
      }
      throw this.handleApiError(error, 'Registration');
    }
  }
}
