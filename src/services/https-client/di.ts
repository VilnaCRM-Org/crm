import type { DependencyContainer } from 'tsyringe';

import { env } from '@/config/env';
import type { ModuleRegistrar } from '@/config/types/module-registrar';
import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import type RequestRetryService from '@/services/resilience/request-retry-service';
import RESILIENCE_TOKENS from '@/services/resilience/tokens';
import type { HttpsClientDeps } from '@/services/types/https-client/https-client-deps';

import DeadlineFetchAdapter from './deadline-fetch-adapter';
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
    this.registerResilientClient(container);
  }

  // The deadline factory is a value, not a class: it carries the configured request timeout,
  // read once from the validated environment (issue #147).
  private registerResilientClient(container: DependencyContainer): void {
    container.register(HTTP_TOKENS.RequestDeadlineFactory, {
      useValue: new RequestDeadlineFactory(env.get().requestTimeoutMs),
    });
    container.registerSingleton(HTTP_TOKENS.DeadlineFetchAdapter, DeadlineFetchAdapter);
    container.register<HttpsClientDeps>(HTTP_TOKENS.HttpsClientDeps, {
      useFactory: (c) => ({
        requestConfigBuilder: c.resolve<HttpRequestConfigBuilder>(
          HTTP_TOKENS.HttpRequestConfigBuilder
        ),
        responseProcessor: c.resolve<HttpResponseProcessor>(HTTP_TOKENS.HttpResponseProcessor),
        deadlines: c.resolve<RequestDeadlineFactory>(HTTP_TOKENS.RequestDeadlineFactory),
        retries: c.resolve<RequestRetryService>(RESILIENCE_TOKENS.RequestRetryService),
      }),
    });
    container.registerSingleton(HTTP_TOKENS.HttpsClient, FetchHttpsClient);
  }
}

export default new HttpClientRegistrar();
