const TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  HttpsClient: Symbol('HttpsClient'),
  ApolloClientSingleton: Symbol('ApolloClientSingleton'),
} as const);

export default TOKENS;
