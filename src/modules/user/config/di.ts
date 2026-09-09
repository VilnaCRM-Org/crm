import { ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client';
import { instanceCachingFactory, type DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';
import AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import type ApolloLinkFactory from '@/services/observability/apollo-link-factory';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type AbortErrorDetector from '@/utils/error/abort-error-detector';
import ERROR_UTILS_TOKENS from '@/utils/error/tokens';
import GraphQLUrl from '@/utils/get-graphql-url';
import {
  ApiErrorFactory,
  ApiStatusErrorFactory,
  AuthErrorFactory,
  LoginAPI,
  RegistrationAPI,
} from '@auth/repositories';
import AuthRepositoryImpl from '@auth/repositories/auth-repository-impl';
import authStateVar, { type AuthStateVar } from '@auth/stores/auth-var';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthRepositoryDeps } from '@auth/types/auth-repository-deps';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';

import AUTH_TOKENS from './tokens';

class UserModuleRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    this.registerGraphqlClient(container);
    this.registerErrorFactories(container);
    this.registerErrorHandling(container);
    this.registerResponseMappers(container);
    this.registerApis(container);
    this.registerRepository(container);
    this.registerAuthState(container);
  }

  // The reactive auth state stays a container-free module singleton so the auth page paints
  // without tsyringe (issue #115). Registering that instance as a value is what lets the
  // container-resolved store actions inject it instead of value-importing it (issue #130).
  private registerAuthState(container: DependencyContainer): void {
    container.register(AUTH_TOKENS.AuthStateVar, { useValue: authStateVar });
    container.register<AuthStoreActionsDeps>(AUTH_TOKENS.AuthStoreActionsDeps, {
      useFactory: (c) => ({
        repository: c.resolve<AuthRepository>(AUTH_TOKENS.AuthRepository),
        authRequestErrors: c.resolve<AuthRequestErrors>(AUTH_TOKENS.AuthRequestErrors),
        observability: c.resolve<ObservabilityService>(OBSERVABILITY_TOKENS.ObservabilityService),
        authState: c.resolve<AuthStateVar>(AUTH_TOKENS.AuthStateVar),
      }),
    });
  }

  private registerGraphqlClient(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.GraphQLUrl, GraphQLUrl);
    container.register<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient, {
      useFactory: instanceCachingFactory((c) => {
        const uri = c.resolve<GraphQLUrl>(AUTH_TOKENS.GraphQLUrl).resolve();
        const link = c
          .resolve<ApolloLinkFactory>(OBSERVABILITY_TOKENS.ApolloLinkFactory)
          .build(uri);
        return new ApolloClient<NormalizedCacheObject>({ link, cache: new InMemoryCache() });
      }),
    });
  }

  private registerErrorFactories(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.ApiStatusErrorFactory, ApiStatusErrorFactory);
    container.registerSingleton(AUTH_TOKENS.ApiErrorFactory, ApiErrorFactory);
  }

  private registerErrorHandling(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.AuthErrorHandler, AuthErrorHandler);
    container.registerSingleton(AUTH_TOKENS.AuthRequestErrors, AuthRequestErrors);
  }

  private registerResponseMappers(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.LoginResponseMapper, LoginResponseMapper);
    container.registerSingleton(AUTH_TOKENS.RegistrationResponseMapper, RegistrationResponseMapper);
    container.registerSingleton(AUTH_TOKENS.AuthUiErrorMapper, AuthUiErrorMapper);
  }

  private registerApis(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.RegistrationAPI, RegistrationAPI);
    container.registerSingleton(AUTH_TOKENS.LoginAPI, LoginAPI);
  }

  private registerRepository(container: DependencyContainer): void {
    container.register<AuthRepositoryDeps>(AUTH_TOKENS.AuthRepositoryDeps, {
      useFactory: (c) => this.buildAuthRepositoryDeps(c),
    });
    container.registerSingleton(AUTH_TOKENS.AuthRepository, AuthRepositoryImpl);
  }

  private buildAuthRepositoryDeps(c: DependencyContainer): AuthRepositoryDeps {
    return {
      loginAPI: c.resolve<LoginAPI>(AUTH_TOKENS.LoginAPI),
      registrationAPI: c.resolve<RegistrationAPI>(AUTH_TOKENS.RegistrationAPI),
      loginResponseMapper: c.resolve<LoginResponseMapper>(AUTH_TOKENS.LoginResponseMapper),
      registrationResponseMapper: c.resolve<RegistrationResponseMapper>(
        AUTH_TOKENS.RegistrationResponseMapper
      ),
      authUiErrorMapper: c.resolve<AuthUiErrorMapper>(AUTH_TOKENS.AuthUiErrorMapper),
      abortDetector: c.resolve<AbortErrorDetector>(ERROR_UTILS_TOKENS.AbortErrorDetector),
      authErrorFactory: c.resolve(AuthErrorFactory),
    };
  }
}

export default new UserModuleRegistrar();
