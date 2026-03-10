import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI, RegistrationAPI } from '@/modules/user/features/auth/repositories';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpsClient from '@/services/https-client/https-client';

const httpsClient = new FetchHttpsClient();

container.register<HttpsClient>(TOKENS.HttpsClient, { useValue: httpsClient });
container.register<RegistrationAPI>(TOKENS.RegistrationAPI, {
  useValue: new RegistrationAPI(httpsClient),
});
container.register<LoginAPI>(TOKENS.LoginAPI, {
  useValue: new LoginAPI(httpsClient),
});

export default container;
