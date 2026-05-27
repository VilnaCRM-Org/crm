const TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  RegistrationAPI: Symbol('RegistrationAPI'),
  HttpsClient: Symbol('HttpsClient'),
  ApiErrorFactory: Symbol('ApiErrorFactory'),
  ErrorParser: Symbol('ErrorParser'),
  LoginResponseMapper: Symbol('LoginResponseMapper'),
  RegistrationResponseMapper: Symbol('RegistrationResponseMapper'),
  AuthUiErrorMapper: Symbol('AuthUiErrorMapper'),
  HttpRequestConfigBuilder: Symbol('HttpRequestConfigBuilder'),
  HttpResponseProcessor: Symbol('HttpResponseProcessor'),
  HttpErrorResponseParser: Symbol('HttpErrorResponseParser'),
  HttpClientFactory: Symbol('HttpClientFactory'),
  AbortErrorDetector: Symbol('AbortErrorDetector'),
} as const);

export default TOKENS;
