import { container } from 'tsyringe';

import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

import TOKENS from './tokens';

container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<RegistrationAPI>(TOKENS.RegistrationAPI, RegistrationAPI);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);

export default container;
