import { ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client';
import { instanceCachingFactory, type DependencyContainer } from 'tsyringe';
import type { StoreApi } from 'zustand';

import sandboxDemoSessionProvider, {
  type SandboxDemoSessionProvider,
} from '@/config/env/sandbox-demo-session-provider';
import type { ModuleRegistrar } from '@/config/types/module-registrar';
import GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import AuthUiErrorMapper from '@/modules/user/store/auth-ui-error-mapper';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import type ApolloLinkFactory from '@/services/observability/apollo-link-factory';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type AbortErrorDetector from '@/utils/error/abort-error-detector';
import ERROR_UTILS_TOKENS from '@/utils/error/tokens';
import GraphQLUrl from '@/utils/get-graphql-url';
import PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import {
  ApiErrorFactory,
  ApiStatusErrorFactory,
  AuthErrorFactory,
  GraphQLPasswordRecoveryRepository,
  LoginAPI,
  RegistrationAPI,
} from '@auth/repositories';
import AuthRepositoryImpl from '@auth/repositories/auth-repository-impl';
import SessionLinkFactory from '@auth/repositories/session-link-factory';
import useAuthStore from '@auth/stores/use-auth-store';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type { AuthRepository } from '@auth/types/auth-repository';
import type { AuthRepositoryDeps } from '@auth/types/auth-repository-deps';
import type { AuthState } from '@auth/types/auth-store';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import AuthErrorHandler from '@auth/utils/auth-error-handler';
import AuthRequestErrors from '@auth/utils/auth-request-errors';
import AuthSecuritySignals from '@auth/utils/auth-security-signals';
import RecoveryFailureHandler from '@auth/utils/recovery-failure-handler';

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

  // The auth store stays a container-free module singleton so the auth page paints without
  // tsyringe (issue #115). Registering it as a value is what lets the container-resolved store
  // actions inject it instead of value-importing it (issue #130).
  private registerAuthState(container: DependencyContainer): void {
    container.register<StoreApi<AuthState>>(AUTH_TOKENS.AuthStore, { useValue: useAuthStore });
    container.register(AUTH_TOKENS.SandboxDemoSessionProvider, {
      useValue: sandboxDemoSessionProvider,
    });
    container.register<AuthStoreActionsDeps>(AUTH_TOKENS.AuthStoreActionsDeps, {
      useFactory: (c) => ({
        repository: c.resolve<AuthRepository>(AUTH_TOKENS.AuthRepository),
        authRequestErrors: c.resolve<AuthRequestErrors>(AUTH_TOKENS.AuthRequestErrors),
        authState: c.resolve<StoreApi<AuthState>>(AUTH_TOKENS.AuthStore),
        securitySignals: c.resolve<AuthSecuritySignals>(AUTH_TOKENS.AuthSecuritySignals),
        sandboxDemoSession: c.resolve<SandboxDemoSessionProvider>(
          AUTH_TOKENS.SandboxDemoSessionProvider
        ),
      }),
    });
  }

  private registerGraphqlClient(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.GraphQLUrl, GraphQLUrl);
    container.registerSingleton(AUTH_TOKENS.SessionLinkFactory, SessionLinkFactory);
    container.register<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient, {
      useFactory: instanceCachingFactory((c) => {
        const uri = c.resolve<GraphQLUrl>(AUTH_TOKENS.GraphQLUrl).resolve();
        const link = c
          .resolve<ApolloLinkFactory>(OBSERVABILITY_TOKENS.ApolloLinkFactory)
          .build(uri);
        const session = c.resolve<SessionLinkFactory>(AUTH_TOKENS.SessionLinkFactory).build();
        return new ApolloClient<NormalizedCacheObject>({
          link: session.concat(link),
          cache: new InMemoryCache(),
        });
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
    container.registerSingleton(AUTH_TOKENS.AuthSecuritySignals, AuthSecuritySignals);
    container.registerSingleton(AUTH_TOKENS.RecoveryFailureHandler, RecoveryFailureHandler);
  }

  private registerResponseMappers(container: DependencyContainer): void {
    container.registerSingleton(AUTH_TOKENS.LoginResponseMapper, LoginResponseMapper);
    container.registerSingleton(AUTH_TOKENS.RegistrationResponseMapper, RegistrationResponseMapper);
    container.registerSingleton(AUTH_TOKENS.AuthUiErrorMapper, AuthUiErrorMapper);
    container.registerSingleton(
      AUTH_TOKENS.PasswordRecoveryTransformer,
      PasswordRecoveryTransformer
    );
    container.registerSingleton(
      AUTH_TOKENS.UserServiceErrorTransformer,
      UserServiceErrorTransformer
    );
    container.registerSingleton(AUTH_TOKENS.GraphQLProfileTransformer, GraphQLProfileTransformer);
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
    container.registerSingleton(
      AUTH_TOKENS.PasswordRecoveryRepository,
      GraphQLPasswordRecoveryRepository
    );
    container.registerSingleton(AUTH_TOKENS.PasswordRecoveryProvider, PasswordRecoveryProvider);
    container.registerSingleton(AUTH_TOKENS.GraphQLProfileRepository, GraphQLProfileRepository);
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
