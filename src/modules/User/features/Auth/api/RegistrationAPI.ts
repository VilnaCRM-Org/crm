import API_ENDPOINTS from '@/config/apiConfig';
import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';
import { inject, injectable } from 'tsyringe';

import type { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

import BaseAPI from './BaseApi';

export interface RegistrationResponse {
  fullName: string;
  email: string;
}

@injectable()
export default class RegistrationAPI extends BaseAPI {
  constructor(@inject(TOKENS.HttpsClient) private readonly httpsClient: HttpsClient) {
    super();
  }

  public async register(credentials: RegisterUserDto): Promise<RegistrationResponse> {
    try {
      return await this.httpsClient.post<RegisterUserDto, RegistrationResponse>(
        API_ENDPOINTS.REGISTER,
        credentials
      );
    } catch (error) {
      throw this.handleApiError(error, 'Registration');
    }
  }
}
