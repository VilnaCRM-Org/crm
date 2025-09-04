import API_ENDPOINTS from '@/config/apiConfig';
import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';
import { injectable, inject } from 'tsyringe';

import { LoginUserDto } from '../types/Credentials';

import BaseAPI from './BaseApi';

export interface LoginResponse {
  token: string;
}

@injectable()
export default class LoginAPI extends BaseAPI {
  constructor(
    @inject(TOKENS.HttpsClient)
    private readonly httpsClient: HttpsClient
  ) {
    super();
  }

  public async login(
    credentials: LoginUserDto,
    options?: { signal?: AbortSignal }
  ): Promise<LoginResponse> {
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
