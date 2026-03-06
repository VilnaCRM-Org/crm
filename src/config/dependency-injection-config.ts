import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI, RegistrationAPI } from '@/modules/user/features/auth/repositories';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpsClient from '@/services/https-client/https-client';

container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<RegistrationAPI>(TOKENS.RegistrationAPI, RegistrationAPI);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);

export default container;
