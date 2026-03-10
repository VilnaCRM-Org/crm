import API_ENDPOINTS from '@/config/api-config';
import type HttpsClient from '@/services/https-client/https-client';

import type { LoginResponse } from '../types/api-responses';
import { LoginUserDto } from '../types/credentials';

import BaseAPI from './base-api';
import { RequestOptions } from './types';

export default class LoginAPI extends BaseAPI {
  constructor(private readonly httpsClient: HttpsClient) {
    super();
  }

  public async login(credentials: LoginUserDto, options?: RequestOptions): Promise<LoginResponse> {
    try {
      return await this.httpsClient.post<LoginUserDto, LoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials,
        options
      );
    } catch (error) {
      throw this.handleApiError(error, 'Login');
    }
  }
}
