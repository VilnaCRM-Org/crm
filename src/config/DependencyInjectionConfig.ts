import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI } from '@/modules/User/features/Auth/api';
import UserRepository from '@/modules/User/repositories/UserRepository';
import ApolloClientService from '@/services/ApolloClient/ApolloClientService';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);
container.registerSingleton<ApolloClientService>(
  TOKENS.ApolloClientService,
  ApolloClientService
);
container.registerSingleton<UserRepository>(TOKENS.UserRepository, UserRepository);

export default container;
