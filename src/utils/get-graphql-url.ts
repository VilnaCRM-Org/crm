import { injectable } from 'tsyringe';

@injectable()
export default class GraphQLUrl {
  private readonly fallback = 'http://localhost:4000/graphql';

  private readonly productionMessage =
    'REACT_APP_GRAPHQL_URL must be defined in production environment. Cannot default to localhost.';

  public resolve(): string {
    const url = process.env.REACT_APP_GRAPHQL_URL?.trim();

    if (process.env.NODE_ENV === 'production' && !url) {
      throw new Error(this.productionMessage);
    }

    return url || this.fallback;
  }
}
