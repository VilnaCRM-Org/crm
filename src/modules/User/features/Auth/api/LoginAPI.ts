import HttpsClient from '@/services/HttpsClient/HttpsClient';
import { container } from 'tsyringe';

import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';

const httpsClient = container.resolve<HttpsClient>('HttpsClient');

export interface LoginResponse {
  token: string;
}

export default class LoginAPI {
  public async login(credentials: LoginUserDto): Promise<LoginResponse> {
    try {
      return await httpsClient.post<LoginResponse>(
        '/api/users',
        credentials as unknown as LoginResponse
      );
    } catch (error) {
      throw new Error('Failed to login. Please try again.');
    }
  }
}
