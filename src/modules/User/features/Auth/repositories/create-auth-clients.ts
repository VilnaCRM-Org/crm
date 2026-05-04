import FetchHttpsClient from '@/services/https-client/fetch-https-client';

import LoginAPI from '@/modules/User/features/Auth/repositories/login-api';
import RegistrationAPI from '@/modules/User/features/Auth/repositories/registration-api';

export type AuthClients = {
  loginAPI: LoginAPI;
  registrationAPI: RegistrationAPI;
};

export default function createAuthClients(): AuthClients {
  const httpsClient = new FetchHttpsClient();

  return {
    loginAPI: new LoginAPI(httpsClient),
    registrationAPI: new RegistrationAPI(httpsClient),
  };
}
