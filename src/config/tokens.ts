const TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  HttpsClient: Symbol('HttpsClient'),
  ApolloClientService: Symbol('ApolloClientService'),
  UserRepository: Symbol('UserRepository'),
} as const);

export default TOKENS;
