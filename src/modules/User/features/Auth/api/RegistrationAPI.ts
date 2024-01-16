import HttpsClient from '@/services/HttpsClient/HttpsClient';
import { container } from 'tsyringe';

const httpsClient = container.resolve<HttpsClient>('HttpsClient');

interface ICredentials {
  nameAndSurname: string;
  email: string;
  password: string;
}

export default class RegistrationAPI {
  public async register(credentials: ICredentials): Promise<void> {
    await httpsClient.post('https://localhost/api/users', credentials);
  }
}
