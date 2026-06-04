import 'reflect-metadata';

import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import HttpsClient from '@/services/https-client/https-client';
import HttpClientFactory from '@/services/https-client/https-client-factory';
import AbortErrorDetector from '@/utils/error/abort-error-detector';
import ErrorParser from '@/utils/error/error-parser';
import { ApiErrorFactory, LoginAPI, RegistrationAPI } from '@auth/repositories';

container.registerSingleton<ApiErrorFactory>(TOKENS.ApiErrorFactory, ApiErrorFactory);
container.registerSingleton<ErrorParser>(TOKENS.ErrorParser, ErrorParser);
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

export default container;
