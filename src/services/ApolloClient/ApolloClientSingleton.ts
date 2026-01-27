import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { injectable } from 'tsyringe';

import { ErrorHandler } from '@/services/error';

const getGraphQLUrl = (): string => {
  const url = process.env.REACT_APP_GRAPHQL_URL;

  if (process.env.NODE_ENV === 'production' && !url) {
    const errorMessage =
      'REACT_APP_GRAPHQL_URL must be defined in production environment. Cannot default to localhost.';
    // eslint-disable-next-line no-console
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return url || 'http://localhost:4000/graphql';
};

const GRAPHQL_URL = getGraphQLUrl();

@injectable()
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

  public static async resetInstance(): Promise<void> {
    const client = this.instance;
    if (client) {
      this.instance = null;
      try {
        await client.clearStore();
      } catch (error) {
        ErrorHandler.handle(error);
      }
    }
  }
}

export default ApolloClientSingleton;
