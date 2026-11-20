import 'reflect-metadata';
import { container } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import socialSignInRegistrar from '@auth/di';
import { GraphQLSocialSignInRepository } from '@auth/repositories';
import authSessionProvider from '@auth/stores/auth-session-provider';
import { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';

describe('social sign-in registrar', () => {
  it('registers the repository, transformer and provider as singletons', () => {
    const child = container.createChildContainer();
    const registerSingleton = jest.spyOn(child, 'registerSingleton');

    socialSignInRegistrar.register(child);

    expect(registerSingleton.mock.calls).toEqual([
      [AUTH_TOKENS.SocialSignInRepository, GraphQLSocialSignInRepository],
      [AUTH_TOKENS.SocialSignInTransformer, SocialSignInTransformer],
      [AUTH_TOKENS.SocialSignInProvider, SocialSignInProvider],
    ]);
  });

  it('binds the store, signals and session collaborators a social sign-in uses', () => {
    const child = container.createChildContainer();

    socialSignInRegistrar.register(child);

    const authStore = { setState: jest.fn() };
    const securitySignals = { signedIn: jest.fn() };
    child.register(AUTH_TOKENS.AuthStore, { useValue: authStore });
    child.register(AUTH_TOKENS.AuthSecuritySignals, { useValue: securitySignals });

    expect(child.resolve(AUTH_TOKENS.SocialSignInDeps)).toEqual({
      authState: authStore,
      securitySignals,
      session: authSessionProvider,
      signedOut: CLEARED_AUTH_STATE,
    });
  });
});
