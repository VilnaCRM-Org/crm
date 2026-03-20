import { container, instanceCachingFactory } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI, RegistrationAPI } from '@/modules/user/features/auth/repositories';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpsClient from '@/services/https-client/https-client';

container.register<HttpsClient>(TOKENS.HttpsClient, {
  useFactory: instanceCachingFactory(() => new FetchHttpsClient()),
});

container.register<LoginAPI>(TOKENS.LoginAPI, {
  useFactory: instanceCachingFactory(
    (dependencyContainer) =>
      new LoginAPI(dependencyContainer.resolve<HttpsClient>(TOKENS.HttpsClient))
  ),
});

container.register<RegistrationAPI>(TOKENS.RegistrationAPI, {
  useFactory: instanceCachingFactory(
    (dependencyContainer) =>
      new RegistrationAPI(dependencyContainer.resolve<HttpsClient>(TOKENS.HttpsClient))
  ),
});

export default container;
