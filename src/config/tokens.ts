const TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  RegistrationAPI: Symbol('RegistrationAPI'),
  HttpsClient: Symbol('HttpsClient'),
} as const);

export default TOKENS;
