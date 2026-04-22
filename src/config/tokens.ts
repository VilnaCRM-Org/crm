const TOKENS = Object.freeze({
  LoginAPI: Symbol('LoginAPI'),
  RegistrationAPI: Symbol('RegistrationAPI'),
  HttpsClient: Symbol('HttpsClient'),
  ApiErrorConverter: Symbol('ApiErrorConverter'),
  ErrorParser: Symbol('ErrorParser'),
  LoginResponseMapper: Symbol('LoginResponseMapper'),
  RegistrationResponseMapper: Symbol('RegistrationResponseMapper'),
  AuthUiErrorMapper: Symbol('AuthUiErrorMapper'),
  HttpRequestConfigBuilder: Symbol('HttpRequestConfigBuilder'),
  HttpResponseProcessor: Symbol('HttpResponseProcessor'),
  HttpTransportErrorHandler: Symbol('HttpTransportErrorHandler'),
  HttpErrorResponseParser: Symbol('HttpErrorResponseParser'),
  HttpErrorStatusGuard: Symbol('HttpErrorStatusGuard'),
  DevToolsRedactor: Symbol('DevToolsRedactor'),
  DevToolsOptionsFactory: Symbol('DevToolsOptionsFactory'),
} as const);

export default TOKENS;
