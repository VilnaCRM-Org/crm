import HttpsClient from '@/services/HttpsClient/HttpsClient';
import { container } from 'tsyringe';

import BaseAPI from '@/modules/User/features/Auth/api/BaseApi';
import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';

const httpsClient = container.resolve<HttpsClient>('HttpsClient');

export interface LoginResponse {
  token: string;
}

export default class LoginAPI extends BaseAPI {
  public async login(credentials: LoginUserDto): Promise<LoginResponse> {
    try {
      return await httpsClient.post<LoginUserDto, LoginResponse>('/api/users/login', credentials);
    } catch (error) {
      throw this.handleApiError(error, 'Login');
    }
  }
}
