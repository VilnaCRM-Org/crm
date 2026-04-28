import 'reflect-metadata';

import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI, RegistrationAPI } from '@/modules/User/features/Auth/api';
import ApiErrorFactory from '@/modules/User/features/Auth/api/api-error-factory';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/User/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/User/store/registration-response-mapper';
import FetchHttpsClient from '@/services/HttpsClient/fetch-https-client';
import HttpErrorResponseParser from '@/services/HttpsClient/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/HttpsClient/http-request-config-builder';
import HttpResponseProcessor from '@/services/HttpsClient/http-response-processor';
import HttpsClient from '@/services/HttpsClient/https-client';
import { DevToolsOptionsFactory } from '@/stores/dev-tools-options';
import { DevToolsRedactor } from '@/stores/dev-tools-redaction';
import ErrorParser from '@/utils/error/error-parser';

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
container.registerSingleton<HttpResponseProcessor>(TOKENS.HttpResponseProcessor, HttpResponseProcessor);
container.registerSingleton<DevToolsRedactor>(TOKENS.DevToolsRedactor, DevToolsRedactor);
container.registerSingleton<DevToolsOptionsFactory>(TOKENS.DevToolsOptionsFactory, DevToolsOptionsFactory);
container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<RegistrationAPI>(TOKENS.RegistrationAPI, RegistrationAPI);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);

export default container;
