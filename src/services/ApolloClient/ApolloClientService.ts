import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { injectable } from 'tsyringe';

import getGraphQLUrl from '@/utils/getGraphQLUrl';

@injectable()
export default class ApolloClientService {
  private readonly client: ApolloClient<NormalizedCacheObject>;

  constructor() {
    this.client = new ApolloClient({
      link: new HttpLink({ uri: getGraphQLUrl() }),
      cache: new InMemoryCache(),
    });
  }

  public getClient(): ApolloClient<NormalizedCacheObject> {
    return this.client;
  }
}
