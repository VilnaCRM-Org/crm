import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';
import { inject, injectable } from 'tsyringe';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

import BaseAPI from './BaseApi';

export interface RegistrationResponse {
  fullName: string;
  email: string;
}
const BASE_URL = (process.env.API_BASE_URL ?? '').trim();

@injectable()
export default class RegistrationAPI extends BaseAPI {
  constructor(@inject(TOKENS.HttpsClient) private readonly httpsClient: HttpsClient) {
    super();
  }

  public async register(credentials: RegisterUserDto): Promise<RegistrationResponse> {
    try {
      return await this.httpsClient.post<RegisterUserDto, RegistrationResponse>(
        `${BASE_URL}/api/users/register`,
        credentials
      );
    } catch (error) {
      throw this.handleApiError(error, 'Registration');
    }
  }
}
