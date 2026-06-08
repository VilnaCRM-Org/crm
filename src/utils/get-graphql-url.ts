export default class GraphQLUrl {
  private static readonly fallback = 'http://localhost:4000/graphql';

  private static readonly productionMessage =
    'REACT_APP_GRAPHQL_URL must be defined in production environment. Cannot default to localhost.';

  public static resolve(): string {
    const url = process.env.REACT_APP_GRAPHQL_URL;

    if (process.env.NODE_ENV === 'production' && !url) {
      throw new Error(GraphQLUrl.productionMessage);
    }

    return url || GraphQLUrl.fallback;
  }
}
