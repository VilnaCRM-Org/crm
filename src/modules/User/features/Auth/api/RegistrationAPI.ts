import API_ENDPOINTS from '@/config/apiConfig';
import TOKENS from '@/config/tokens';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';
import { inject, injectable } from 'tsyringe';

import type { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

import type { RegistrationResponse } from '../types/ApiResponses';

import BaseAPI from './BaseAPI';
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
