const TOKENS = Object.freeze({
  HttpsClient: Symbol('HttpsClient'),
  ApolloClient: Symbol('ApolloClient'),
  UserRemoteSource: Symbol('UserRemoteSource'),
  UserRepository: Symbol('UserRepository'),
} as const);

export default TOKENS;
