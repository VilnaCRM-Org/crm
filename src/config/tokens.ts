const TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  RegistrationAPI: Symbol('RegistrationAPI'),
  HttpsClient: Symbol('HttpsClient'),
  ErrorHandler: Symbol('ErrorHandler'),
} as const);

export default TOKENS;
