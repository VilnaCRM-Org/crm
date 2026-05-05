import API_ENDPOINTS from '@/config/api-config';
import type HttpsClient from '@/services/https-client/https-client';

import type { RegisterUserDto } from '@/modules/User/features/Auth/types/credentials';

import type { RegistrationResponse } from '../types/api-responses';

import BaseAPI from './base-api';
import { RequestOptions } from './types';

export default class RegistrationAPI extends BaseAPI {
  constructor(private readonly httpsClient: HttpsClient) {
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
