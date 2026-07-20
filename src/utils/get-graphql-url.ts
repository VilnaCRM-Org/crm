import { injectable } from 'tsyringe';

import { env } from '@/config/env';

@injectable()
export default class GraphQLUrl {
  private readonly fallback = 'http://localhost:4000/graphql';

  private readonly productionMessage =
    'REACT_APP_GRAPHQL_URL must be defined in production environment. Cannot default to localhost.';

  public resolve(): string {
    const url = env.graphqlUrl();

    if (env.isProduction() && !url) {
      throw new Error(this.productionMessage);
    }

    return url || this.fallback;
  }
}
