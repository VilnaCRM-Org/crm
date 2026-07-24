import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import FetchHttpsClient from './fetch-https-client';
import HttpErrorGuard from './http-error-guard';
import HttpErrorResponseParser from './http-error-response-parser';
import HttpRequestConfigBuilder from './http-request-config-builder';
import HttpResponseProcessor from './http-response-processor';
import HttpClientFactory from './https-client-factory';
import HTTP_TOKENS from './tokens';

class HttpClientRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(HTTP_TOKENS.HttpErrorGuard, HttpErrorGuard);
    container.registerSingleton(HTTP_TOKENS.HttpRequestConfigBuilder, HttpRequestConfigBuilder);
    container.registerSingleton(HTTP_TOKENS.HttpErrorResponseParser, HttpErrorResponseParser);
    container.registerSingleton(HTTP_TOKENS.HttpResponseProcessor, HttpResponseProcessor);
    container.registerSingleton(HTTP_TOKENS.HttpClientFactory, HttpClientFactory);
    container.registerSingleton(HTTP_TOKENS.HttpsClient, FetchHttpsClient);
  }
}

export default new HttpClientRegistrar();
