import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';
import { injectable, inject } from 'tsyringe';

import { LoginUserDto } from '../types/Credentials';

import BaseAPI from './BaseApi';

export interface LoginResponse {
  token: string;
}

const BASE_URL = (process.env.API_BASE_URL ?? '').trim();

@injectable()
export default class LoginAPI extends BaseAPI {
  constructor(
    @inject(TOKENS.HttpsClient)
    private readonly httpsClient: HttpsClient
  ) {
    super();
  }

  public async login(credentials: LoginUserDto): Promise<LoginResponse> {
    try {
      return await this.httpsClient.post<LoginUserDto, LoginResponse>(
        `${BASE_URL}/api/users/login`,
        credentials
      );
    } catch (error) {
      throw this.handleApiError(error, 'Login');
    }
  }
}
