import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI } from '@/modules/User/features/Auth/api';
import ApolloClientSingleton from '@/services/ApolloClient/ApolloClientSingleton';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import HttpsClient from '@/services/HttpsClient/HttpsClient';

container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);
container.registerSingleton<ApolloClientSingleton>(
  TOKENS.ApolloClientSingleton,
  ApolloClientSingleton
);

export default container;
