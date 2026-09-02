import 'reflect-metadata';
import { container, type DependencyContainer } from 'tsyringe';

import runtimeConfigRegistrar from '@/config/runtime/di';
import userModuleRegistrar from '@/modules/user/config/di';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import LoginResponseMapper from '@/modules/user/store/login-response-mapper';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import GraphQLUrl from '@/utils/get-graphql-url';

const GRAPHQL_CLIENT_TOKENS = [AUTH_TOKENS.GraphQLUrl, AUTH_TOKENS.ApolloClient];
const ERROR_FACTORY_TOKENS = [AUTH_TOKENS.ApiStatusErrorFactory, AUTH_TOKENS.ApiErrorFactory];
const ERROR_HANDLING_TOKENS = [AUTH_TOKENS.AuthErrorHandler, AUTH_TOKENS.AuthRequestErrors];
const RESPONSE_MAPPER_TOKENS = [
  AUTH_TOKENS.LoginResponseMapper,
  AUTH_TOKENS.RegistrationResponseMapper,
  AUTH_TOKENS.AuthUiErrorMapper,
];
const API_TOKENS = [AUTH_TOKENS.RegistrationAPI, AUTH_TOKENS.LoginAPI];
const REPOSITORY_TOKENS = [AUTH_TOKENS.AuthRepositoryDeps, AUTH_TOKENS.AuthRepository];
const EVERY_TOKEN = [
  ...GRAPHQL_CLIENT_TOKENS,
  ...ERROR_FACTORY_TOKENS,
  ...ERROR_HANDLING_TOKENS,
  ...RESPONSE_MAPPER_TOKENS,
  ...API_TOKENS,
  ...REPOSITORY_TOKENS,
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

  it('registers the mappers as singletons rather than per-resolve instances', () => {
    const child = registeredContainer();

    const mapper = child.resolve(AUTH_TOKENS.LoginResponseMapper);

    expect(child.resolve(AUTH_TOKENS.LoginResponseMapper)).toBe(mapper);
  });
});
