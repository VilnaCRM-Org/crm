import 'reflect-metadata';
import { container, type DependencyContainer } from 'tsyringe';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import runtimeConfigRegistrar from '@/config/runtime/di';
import userModuleRegistrar from '@/modules/user/config/di';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import GraphQLUrl from '@/utils/get-graphql-url';
import PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import useAuthStore from '@auth/stores/use-auth-store';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';

const GRAPHQL_CLIENT_TOKENS = [AUTH_TOKENS.GraphQLUrl, AUTH_TOKENS.ApolloClient];
const ERROR_FACTORY_TOKENS = [AUTH_TOKENS.ApiStatusErrorFactory, AUTH_TOKENS.ApiErrorFactory];
const ERROR_HANDLING_TOKENS = [
  AUTH_TOKENS.AuthErrorHandler,
  AUTH_TOKENS.AuthRequestErrors,
  AUTH_TOKENS.AuthSecuritySignals,
];
const RESPONSE_MAPPER_TOKENS = [
  AUTH_TOKENS.LoginResponseMapper,
  AUTH_TOKENS.RegistrationResponseMapper,
  AUTH_TOKENS.AuthUiErrorMapper,
];
const API_TOKENS = [AUTH_TOKENS.RegistrationAPI, AUTH_TOKENS.LoginAPI];
const REPOSITORY_TOKENS = [AUTH_TOKENS.AuthRepositoryDeps, AUTH_TOKENS.AuthRepository];
const PASSWORD_RECOVERY_TOKENS = [
  AUTH_TOKENS.PasswordRecoveryTransformer,
  AUTH_TOKENS.UserServiceErrorTransformer,
  AUTH_TOKENS.PasswordRecoveryRepository,
  AUTH_TOKENS.PasswordRecoveryProvider,
];
const AUTH_STATE_TOKENS = [
  AUTH_TOKENS.AuthStore,
  AUTH_TOKENS.SandboxDemoSessionProvider,
  AUTH_TOKENS.AuthStoreActionsDeps,
];
const EVERY_TOKEN = [
  ...GRAPHQL_CLIENT_TOKENS,
  ...ERROR_FACTORY_TOKENS,
  ...ERROR_HANDLING_TOKENS,
  ...RESPONSE_MAPPER_TOKENS,
  ...API_TOKENS,
  ...REPOSITORY_TOKENS,
  ...PASSWORD_RECOVERY_TOKENS,
  ...AUTH_STATE_TOKENS,
];

function registeredContainer(): DependencyContainer {
  const child = container.createChildContainer();
  userModuleRegistrar.register(child);

  return child;
}

function expectAllRegistered(child: DependencyContainer, tokens: readonly symbol[]): void {
  tokens.forEach((token) => {
    expect([token.description, child.isRegistered(token)]).toEqual([token.description, true]);
  });
}

describe('user module composition root', () => {
  it('leaves a container untouched until register is called', () => {
    const child = container.createChildContainer();

    EVERY_TOKEN.forEach((token) => {
      expect([token.description, child.isRegistered(token)]).toEqual([token.description, false]);
    });
  });

  it('binds every auth token the module owns in a single register call', () => {
    expectAllRegistered(registeredContainer(), EVERY_TOKEN);
  });

  it('binds the graphql url and the apollo client', () => {
    const child = registeredContainer();
    runtimeConfigRegistrar.register(child);

    expectAllRegistered(child, GRAPHQL_CLIENT_TOKENS);
    expect(child.resolve(AUTH_TOKENS.GraphQLUrl)).toBeInstanceOf(GraphQLUrl);
  });

  it('binds the api error factories', () => {
    expectAllRegistered(registeredContainer(), ERROR_FACTORY_TOKENS);
  });

  it('binds the auth error handler and the auth request errors', () => {
    expectAllRegistered(registeredContainer(), ERROR_HANDLING_TOKENS);
  });

  it('binds the login, registration and ui error response mappers', () => {
    const child = registeredContainer();

    expectAllRegistered(child, RESPONSE_MAPPER_TOKENS);
    expect(child.resolve(AUTH_TOKENS.LoginResponseMapper)).toBeInstanceOf(LoginResponseMapper);
    expect(child.resolve(AUTH_TOKENS.RegistrationResponseMapper)).toBeInstanceOf(
      RegistrationResponseMapper
    );
  });

  it('binds the login and registration apis', () => {
    expectAllRegistered(registeredContainer(), API_TOKENS);
  });

  it('binds the auth repository and its dependency bundle', () => {
    expectAllRegistered(registeredContainer(), REPOSITORY_TOKENS);
  });

  it('binds the password recovery transformers, repository and provider as singletons', () => {
    const child = registeredContainer();

    expectAllRegistered(child, PASSWORD_RECOVERY_TOKENS);
    child.register(AUTH_TOKENS.ApolloClient, { useValue: {} });
    const provider = child.resolve(AUTH_TOKENS.PasswordRecoveryProvider);
    expect(provider).toBeInstanceOf(PasswordRecoveryProvider);
    expect(child.resolve(AUTH_TOKENS.PasswordRecoveryProvider)).toBe(provider);
    expect(child.resolve(AUTH_TOKENS.PasswordRecoveryRepository)).toBeInstanceOf(
      GraphQLPasswordRecoveryRepository
    );
    expect(child.resolve(AUTH_TOKENS.PasswordRecoveryTransformer)).toBeInstanceOf(
      PasswordRecoveryTransformer
    );
    expect(child.resolve(AUTH_TOKENS.UserServiceErrorTransformer)).toBeInstanceOf(
      UserServiceErrorTransformer
    );
  });

  it('binds the auth store and the store action dependency bundle', () => {
    expectAllRegistered(registeredContainer(), AUTH_STATE_TOKENS);
  });

  it('binds the container-free auth store singleton by value, not by construction', () => {
    const child = registeredContainer();

    expect(child.resolve(AUTH_TOKENS.AuthStore)).toBe(useAuthStore);
  });

  it('hands the container-free sandbox demo seed to the store actions by value', () => {
    const child = registeredContainer();
    child.register(AUTH_TOKENS.AuthRepository, { useValue: {} });
    child.register(AUTH_TOKENS.AuthRequestErrors, { useValue: {} });
    child.register(AUTH_TOKENS.AuthSecuritySignals, { useValue: {} });

    expect(child.resolve(AUTH_TOKENS.SandboxDemoSessionProvider)).toBe(sandboxDemoSessionProvider);
    expect(
      child.resolve<AuthStoreActionsDeps>(AUTH_TOKENS.AuthStoreActionsDeps).sandboxDemoSession
    ).toBe(sandboxDemoSessionProvider);
  });

  it('registers the mappers as singletons rather than per-resolve instances', () => {
    const child = registeredContainer();

    const mapper = child.resolve(AUTH_TOKENS.LoginResponseMapper);

    expect(child.resolve(AUTH_TOKENS.LoginResponseMapper)).toBe(mapper);
  });
});
