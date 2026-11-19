import 'reflect-metadata';
import { container } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import SocialSignInProvider from '@auth/data-providers/social-sign-in-provider';
import socialSignInRegistrar from '@auth/di';
import { GraphQLSocialSignInRepository } from '@auth/repositories';
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
});
