import 'reflect-metadata';
import { container, type DependencyContainer } from 'tsyringe';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import runtimeConfigRegistrar from '@/config/runtime/di';
import userModuleRegistrar from '@/modules/user/config/di';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import ProfileProvider from '@/modules/user/features/settings/data-providers/profile-provider';
import GraphQLProfileRepository from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer from '@/modules/user/features/settings/transformers';
import RegistrationResponseMapper from '@/modules/user/store/registration-response-mapper';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import GraphQLUrl from '@/utils/get-graphql-url';
import PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import SessionLinkFactory from '@auth/repositories/session-link-factory';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import type { AuthStoreActionsDeps } from '@auth/types/auth-store-actions-deps';
import type { SessionLinkDeps } from '@auth/types/session-link-deps';

const GRAPHQL_CLIENT_TOKENS = [AUTH_TOKENS.GraphQLUrl, AUTH_TOKENS.ApolloClient];
const ERROR_FACTORY_TOKENS = [AUTH_TOKENS.ApiStatusErrorFactory, AUTH_TOKENS.ApiErrorFactory];
const ERROR_HANDLING_TOKENS = [
  AUTH_TOKENS.AuthErrorHandler,
  AUTH_TOKENS.AuthRequestErrors,
  AUTH_TOKENS.AuthSecuritySignals,
];
const RESPONSE_MAPPER_TOKENS = [
  AUTH_TOKENS.RegistrationResponseMapper,
  AUTH_TOKENS.AuthUiErrorMapper,
];
const API_TOKENS = [AUTH_TOKENS.RegistrationAPI];
const REPOSITORY_TOKENS = [AUTH_TOKENS.AuthRepositoryDeps, AUTH_TOKENS.AuthRepository];
const PASSWORD_RECOVERY_TOKENS = [
  AUTH_TOKENS.PasswordRecoveryTransformer,
  AUTH_TOKENS.UserServiceErrorTransformer,
  AUTH_TOKENS.PasswordRecoveryRepository,
  AUTH_TOKENS.PasswordRecoveryProvider,
];
const SETTINGS_TOKENS = [
  AUTH_TOKENS.GraphQLProfileTransformer,
  AUTH_TOKENS.GraphQLProfileRepository,
  AUTH_TOKENS.ProfileProvider,
  AUTH_TOKENS.UserDisplayNameMapper,
];
const SIGN_IN_TOKENS = [
  AUTH_TOKENS.GraphQLSignInRepository,
  AUTH_TOKENS.GraphQLSignInTransformer,
  AUTH_TOKENS.GraphQLSignInProvider,
];
const TWO_FACTOR_SETTINGS_TOKENS = [
  AUTH_TOKENS.GraphQLTwoFactorSettingsRepository,
  AUTH_TOKENS.GraphQLTwoFactorSettingsTransformer,
  AUTH_TOKENS.TwoFactorSettingsProvider,
];
const AUTH_STATE_TOKENS = [
  AUTH_TOKENS.AuthStore,
  AUTH_TOKENS.SandboxDemoSessionProvider,
  AUTH_TOKENS.AuthStoreActionsDeps,
  AUTH_TOKENS.SessionLinkDeps,
];
const SESSION_LINK_TOKENS = [AUTH_TOKENS.SessionLinkFactory];
const EVERY_TOKEN = [
  ...GRAPHQL_CLIENT_TOKENS,
  ...ERROR_FACTORY_TOKENS,
  ...ERROR_HANDLING_TOKENS,
  ...RESPONSE_MAPPER_TOKENS,
  ...API_TOKENS,
  ...REPOSITORY_TOKENS,
  ...PASSWORD_RECOVERY_TOKENS,
  ...SETTINGS_TOKENS,
  ...SIGN_IN_TOKENS,
  ...TWO_FACTOR_SETTINGS_TOKENS,
  ...AUTH_STATE_TOKENS,
  ...SESSION_LINK_TOKENS,
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

  it('binds the registration and ui error response mappers', () => {
    const child = registeredContainer();

    expectAllRegistered(child, RESPONSE_MAPPER_TOKENS);
    expect(child.resolve(AUTH_TOKENS.RegistrationResponseMapper)).toBeInstanceOf(
      RegistrationResponseMapper
    );
  });

  it('binds the registration api and no REST login', () => {
    expectAllRegistered(registeredContainer(), API_TOKENS);
    expect(AUTH_TOKENS).not.toHaveProperty('LoginAPI');
    expect(AUTH_TOKENS).not.toHaveProperty('LoginResponseMapper');
  });

  it('binds the auth repository and its dependency bundle', () => {
    expectAllRegistered(registeredContainer(), REPOSITORY_TOKENS);
  });

  it('binds the password recovery transformers, repository and provider as singletons', () => {
    const child = registeredContainer();

    expectAllRegistered(child, PASSWORD_RECOVERY_TOKENS);
    child.register(AUTH_TOKENS.ApolloClient, { useValue: {} });
    child.register(OBSERVABILITY_TOKENS.ObservabilityService, { useValue: {} });
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

  it('binds the settings collaborators and the display-name mapper as singletons', () => {
    const child = registeredContainer();

    expectAllRegistered(child, SETTINGS_TOKENS);
    child.register(AUTH_TOKENS.ApolloClient, { useValue: {} });
    child.register(OBSERVABILITY_TOKENS.ObservabilityService, { useValue: {} });
    const provider = child.resolve(AUTH_TOKENS.ProfileProvider);
    expect(provider).toBeInstanceOf(ProfileProvider);
    expect(child.resolve(AUTH_TOKENS.ProfileProvider)).toBe(provider);
    const repository = child.resolve(AUTH_TOKENS.GraphQLProfileRepository);
    expect(repository).toBeInstanceOf(GraphQLProfileRepository);
    expect(child.resolve(AUTH_TOKENS.GraphQLProfileRepository)).toBe(repository);
    const transformer = child.resolve(AUTH_TOKENS.GraphQLProfileTransformer);
    expect(transformer).toBeInstanceOf(GraphQLProfileTransformer);
    expect(child.resolve(AUTH_TOKENS.GraphQLProfileTransformer)).toBe(transformer);
    const displayNameMapper = child.resolve(AUTH_TOKENS.UserDisplayNameMapper);
    expect(displayNameMapper).toBeInstanceOf(UserDisplayNameMapper);
    expect(child.resolve(AUTH_TOKENS.UserDisplayNameMapper)).toBe(displayNameMapper);
  });

  it('binds the graphql sign-in repository, transformer and provider', () => {
    expectAllRegistered(registeredContainer(), SIGN_IN_TOKENS);
  });

  it('binds the two-factor settings repository, transformer and provider', () => {
    expectAllRegistered(registeredContainer(), TWO_FACTOR_SETTINGS_TOKENS);
  });

  it('binds the session link factory as a singleton over the session link bundle', () => {
    const child = registeredContainer();
    child.register(OBSERVABILITY_TOKENS.ObservabilityService, { useValue: {} });

    expectAllRegistered(child, SESSION_LINK_TOKENS);
    const factory = child.resolve(AUTH_TOKENS.SessionLinkFactory);
    expect(factory).toBeInstanceOf(SessionLinkFactory);
    expect(child.resolve(AUTH_TOKENS.SessionLinkFactory)).toBe(factory);
  });

  it('binds the auth store and the store action dependency bundle', () => {
    expectAllRegistered(registeredContainer(), AUTH_STATE_TOKENS);
  });

  it('binds the container-free auth store singleton by value, not by construction', () => {
    const child = registeredContainer();

    expect(child.resolve(AUTH_TOKENS.AuthStore)).toBe(useAuthStore);
  });

  it('registers the sandbox demo seed by value, out of the store deps', () => {
    const child = registeredContainer();
    child.register(AUTH_TOKENS.AuthRepository, { useValue: {} });
    child.register(AUTH_TOKENS.AuthRequestErrors, { useValue: {} });
    child.register(AUTH_TOKENS.AuthSecuritySignals, { useValue: {} });

    expect(child.resolve(AUTH_TOKENS.SandboxDemoSessionProvider)).toBe(sandboxDemoSessionProvider);
    expect(
      Object.keys(child.resolve<AuthStoreActionsDeps>(AUTH_TOKENS.AuthStoreActionsDeps)).sort()
    ).toEqual(['authRequestErrors', 'authState', 'repository', 'securitySignals']);
  });

  it('hands the session link the logout() collaborators and the cleared auth state', () => {
    const child = registeredContainer();
    const observability = { clearUser: jest.fn() };
    child.register(OBSERVABILITY_TOKENS.ObservabilityService, { useValue: observability });

    const deps = child.resolve<SessionLinkDeps>(AUTH_TOKENS.SessionLinkDeps);

    expect(deps.authStore).toBe(useAuthStore);
    expect(deps.signedOut).toBe(CLEARED_AUTH_STATE);
    expect(deps.sandboxDemoSession).toBe(sandboxDemoSessionProvider);
    expect(deps.observability).toBe(observability);
    expect(deps.errors).toBe(child.resolve(AUTH_TOKENS.UserServiceErrorTransformer));
  });

  it('registers the mappers as singletons rather than per-resolve instances', () => {
    const child = registeredContainer();

    const mapper = child.resolve(AUTH_TOKENS.RegistrationResponseMapper);

    expect(child.resolve(AUTH_TOKENS.RegistrationResponseMapper)).toBe(mapper);
  });
});
