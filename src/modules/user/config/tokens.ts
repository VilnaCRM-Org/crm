const AUTH_TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  RegistrationAPI: Symbol('RegistrationAPI'),
  ApolloClient: Symbol('ApolloClient'),
  GraphQLUrl: Symbol('GraphQLUrl'),
  ApiErrorFactory: Symbol('ApiErrorFactory'),
  ApiStatusErrorFactory: Symbol('ApiStatusErrorFactory'),
  AuthRepository: Symbol('AuthRepository'),
  AuthRepositoryDeps: Symbol('AuthRepositoryDeps'),
  LoginResponseMapper: Symbol('LoginResponseMapper'),
  RegistrationResponseMapper: Symbol('RegistrationResponseMapper'),
  AuthUiErrorMapper: Symbol('AuthUiErrorMapper'),
  AuthErrorHandler: Symbol('AuthErrorHandler'),
  AuthRequestErrors: Symbol('AuthRequestErrors'),
  AuthStateVar: Symbol('AuthStateVar'),
  AuthStoreActionsDeps: Symbol('AuthStoreActionsDeps'),
} as const);

export default AUTH_TOKENS;
