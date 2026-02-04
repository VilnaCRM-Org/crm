import { ApolloClient, HttpLink, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { UserRepository, UserRemoteSource } from '@/modules/user/features/auth/repositories';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpsClient from '@/services/https-client/https-client';
import getGraphQLUrl from '@/utils/get-graphql-url';

// Global services
container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);

// Apollo client
const apolloClient = new ApolloClient<NormalizedCacheObject>({
  link: new HttpLink({ uri: getGraphQLUrl() }),
  cache: new InMemoryCache(),
});
container.registerInstance(TOKENS.ApolloClient, apolloClient);

// User feature
container.registerSingleton<UserRemoteSource>(TOKENS.UserRemoteSource, UserRemoteSource);
container.registerSingleton<UserRepository>(TOKENS.UserRepository, UserRepository);

export default container;
