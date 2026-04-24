import 'reflect-metadata';

import { container } from 'tsyringe';

import TOKENS from '@/config/tokens';
import { LoginAPI, RegistrationAPI } from '@/modules/User/features/Auth/api';
import ApiErrorConverter from '@/modules/User/features/Auth/api/api-error-converter';
import AuthUiErrorMapper from '@/modules/User/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/User/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/User/store/registration-response-mapper';
import FetchHttpsClient from '@/services/HttpsClient/fetch-https-client';
import HttpErrorResponseParser from '@/services/HttpsClient/http-error-response-parser';
import HttpErrorStatusGuard from '@/services/HttpsClient/http-error-status-guard';
import HttpRequestConfigBuilder from '@/services/HttpsClient/http-request-config-builder';
import HttpResponseProcessor from '@/services/HttpsClient/http-response-processor';
import HttpTransportErrorHandler from '@/services/HttpsClient/http-transport-error-handler';
import HttpsClient from '@/services/HttpsClient/https-client';
import { DevToolsOptionsFactory } from '@/stores/dev-tools-options';
import { DevToolsRedactor } from '@/stores/dev-tools-redaction';
import ErrorParser from '@/utils/error/error-parser';

container.registerSingleton<ApiErrorConverter>(TOKENS.ApiErrorConverter, ApiErrorConverter);
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
container.registerSingleton<HttpErrorStatusGuard>(TOKENS.HttpErrorStatusGuard, HttpErrorStatusGuard);
container.registerSingleton<HttpResponseProcessor>(TOKENS.HttpResponseProcessor, HttpResponseProcessor);
container.registerSingleton<HttpTransportErrorHandler>(
  TOKENS.HttpTransportErrorHandler,
  HttpTransportErrorHandler
);
container.registerSingleton<DevToolsRedactor>(TOKENS.DevToolsRedactor, DevToolsRedactor);
container.registerSingleton<DevToolsOptionsFactory>(TOKENS.DevToolsOptionsFactory, DevToolsOptionsFactory);
container.registerSingleton<HttpsClient>(TOKENS.HttpsClient, FetchHttpsClient);
container.registerSingleton<RegistrationAPI>(TOKENS.RegistrationAPI, RegistrationAPI);
container.registerSingleton<LoginAPI>(TOKENS.LoginAPI, LoginAPI);

export default container;
