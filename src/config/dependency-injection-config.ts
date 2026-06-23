import 'reflect-metadata';

import { ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client';
import { container, instanceCachingFactory } from 'tsyringe';

import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import { ErrorHandler } from '@/services/error';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpErrorGuard from '@/services/https-client/http-error-guard';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import HttpClientFactory from '@/services/https-client/https-client-factory';
import type { HttpsClient } from '@/services/types/https-client/https-client';
import AbortErrorDetector from '@/utils/error/abort-error-detector';
import ErrorParser from '@/utils/error/error-parser';
import GraphQLUrl from '@/utils/get-graphql-url';
import {
  ApiErrorFactory,
  ApiStatusErrorFactory,
  AuthErrorFactory,
  LoginAPI,
  RegistrationAPI,
} from '@auth/repositories';
import AuthRepositoryImpl from '@auth/repositories/auth-repository-impl';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthRepositoryDeps } from '@auth/types/auth-repository-deps';
import AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';

container.register<ApolloClient<NormalizedCacheObject>>(TOKENS.ApolloClient, {
  useFactory: instanceCachingFactory(
    () =>
      new ApolloClient<NormalizedCacheObject>({
        uri: container.resolve<GraphQLUrl>(TOKENS.GraphQLUrl).resolve(),
        cache: new InMemoryCache(),
      })
  ),
});
container.registerSingleton<GraphQLUrl>(TOKENS.GraphQLUrl, GraphQLUrl);
container.registerSingleton<HttpErrorGuard>(TOKENS.HttpErrorGuard, HttpErrorGuard);
container.registerSingleton<ApiStatusErrorFactory>(
  TOKENS.ApiStatusErrorFactory,
  ApiStatusErrorFactory
);
container.registerSingleton<ApiErrorFactory>(TOKENS.ApiErrorFactory, ApiErrorFactory);
container.registerSingleton<ErrorParser>(TOKENS.ErrorParser, ErrorParser);
container.registerSingleton<ErrorHandler>(TOKENS.ErrorHandler, ErrorHandler);
container.registerSingleton<AuthErrorHandler>(TOKENS.AuthErrorHandler, AuthErrorHandler);
container.registerSingleton<AuthRequestErrors>(TOKENS.AuthRequestErrors, AuthRequestErrors);
container.registerSingleton<LoginResponseMapper>(TOKENS.LoginResponseMapper, LoginResponseMapper);
container.registerSingleton<RegistrationResponseMapper>(
  TOKENS.RegistrationResponseMapper,
  RegistrationResponseMapper
);
container.registerSingleton<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper, AuthUiErrorMapper);
container.registerSingleton<HttpRequestConfigBuilder>(
  TOKENS.HttpRequestConfigBuilder,
  HttpRequestConfigBuilder
);
container.registerSingleton<HttpErrorResponseParser>(
  TOKENS.HttpErrorResponseParser,
  HttpErrorResponseParser
);
container.registerSingleton<HttpResponseProcessor>(
  TOKENS.HttpResponseProcessor,
  HttpResponseProcessor
);
container.registerSingleton<HttpClientFactory>(TOKENS.HttpClientFactory, HttpClientFactory);
container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<RegistrationAPI>(TOKENS.RegistrationAPI, RegistrationAPI);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);
container.registerSingleton<AbortErrorDetector>(TOKENS.AbortErrorDetector, AbortErrorDetector);

container.register<AuthRepositoryDeps>(TOKENS.AuthRepositoryDeps, {
  useFactory: (c) => ({
    loginAPI: c.resolve<LoginAPI>(TOKENS.LoginAPI),
    registrationAPI: c.resolve<RegistrationAPI>(TOKENS.RegistrationAPI),
    loginResponseMapper: c.resolve<LoginResponseMapper>(TOKENS.LoginResponseMapper),
    registrationResponseMapper: c.resolve<RegistrationResponseMapper>(
      TOKENS.RegistrationResponseMapper
    ),
    authUiErrorMapper: c.resolve<AuthUiErrorMapper>(TOKENS.AuthUiErrorMapper),
    abortDetector: c.resolve<AbortErrorDetector>(TOKENS.AbortErrorDetector),
    authErrorFactory: c.resolve(AuthErrorFactory),
  }),
});
container.registerSingleton<AuthRepository>(TOKENS.AuthRepository, AuthRepositoryImpl);

export default container;
