import HttpsClient from '@/services/HttpsClient/HttpsClient';
import { container } from 'tsyringe';

import { RegisterUserDto } from '@/modules/User/features/Auth/types/Credentials';

const httpsClient = container.resolve<HttpsClient>('HttpsClient');

export default class RegistrationAPI {
  public async register(credentials: RegisterUserDto): Promise<void> {
    try {
      await httpsClient.post(`/api/users`, credentials);
    } catch (error) {
      throw new Error('Failed to register user. Please try again.');
    }
  }
}
