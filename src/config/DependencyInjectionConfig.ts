import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI, RegistrationAPI } from '@/modules/User/features/Auth/api';
import { ErrorHandler } from '@/services/error';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<RegistrationAPI>(TOKENS.RegistrationAPI, RegistrationAPI);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);
container.registerSingleton<ErrorHandler>(TOKENS.ErrorHandler, ErrorHandler);

export default container;
