import HttpsClient from '@/services/HttpsClient/HttpsClient';
import { container } from 'tsyringe';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

import BaseAPI from './BaseApi';

const httpsClient = container.resolve<HttpsClient>('HttpsClient');

export interface RegistrationResponse {
  id: string;
  fullName: string;
  email: string;
}

export default class RegistrationAPI extends BaseAPI {
  public async register(credentials: RegisterUserDto): Promise<RegistrationResponse> {
    try {
      return await httpsClient.post<RegisterUserDto, RegistrationResponse>(
        '/api/users',
        credentials
      );
    } catch (error) {
      throw this.handleApiError(error, 'Registration');
    }
  }
}
