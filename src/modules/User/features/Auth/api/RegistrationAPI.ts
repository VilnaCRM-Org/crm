import HttpsClient from '@/services/HttpsClient/HttpsClient';
import { container } from 'tsyringe';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

import BaseAPI from './BaseApi';

const httpsClient = container.resolve<HttpsClient>('HttpsClient');

export default class RegistrationAPI extends BaseAPI {
  public async register(credentials: RegisterUserDto): Promise<void> {
    try {
      await httpsClient.post<RegisterUserDto, void>('/api/users', credentials);
    } catch (error) {
      throw this.handleApiError(error, 'Registration');
    }
  }
}
