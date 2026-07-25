const HTTP_TOKENS = Object.freeze({
  HttpsClient: Symbol('HttpsClient'),
  HttpRequestConfigBuilder: Symbol('HttpRequestConfigBuilder'),
  HttpResponseProcessor: Symbol('HttpResponseProcessor'),
  HttpErrorResponseParser: Symbol('HttpErrorResponseParser'),
  HttpClientFactory: Symbol('HttpClientFactory'),
  HttpErrorGuard: Symbol('HttpErrorGuard'),
} as const);

export default HTTP_TOKENS;
