import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';

const GRAPHQL_URL = process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:4000/graphql';

class ApolloClientSingleton {
  private static instance: ApolloClient<NormalizedCacheObject> | null = null;

  public static getInstance(): ApolloClient<NormalizedCacheObject> {
    if (!this.instance) {
      this.instance = new ApolloClient({
        link: new HttpLink({ uri: GRAPHQL_URL }),
        cache: new InMemoryCache(),
      });
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearStore();
      this.instance = null;
    }
  }
}

export default ApolloClientSingleton;
