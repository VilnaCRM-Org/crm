import 'reflect-metadata';
import { container } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import ProfileProvider, {
  SocialLinkProvider,
  TwoFactorSettingsProvider,
} from '@/modules/user/features/settings/data-providers';
import userSettingsRegistrar from '@/modules/user/features/settings/di';
import GraphQLProfileRepository, {
  GraphQLSocialLinkRepository,
  GraphQLTwoFactorSettingsRepository,
} from '@/modules/user/features/settings/repositories';
import GraphQLProfileTransformer, {
  GraphQLSocialLinkTransformer,
  GraphQLTwoFactorSettingsTransformer,
} from '@/modules/user/features/settings/transformers';

describe('user settings registrar', () => {
  it('registers the profile, two-factor settings and social link layers as singletons', () => {
    const child = container.createChildContainer();
    const registerSingleton = jest.spyOn(child, 'registerSingleton');

    userSettingsRegistrar.register(child);

    expect(registerSingleton.mock.calls).toEqual([
      [AUTH_TOKENS.GraphQLSocialLinkRepository, GraphQLSocialLinkRepository],
      [AUTH_TOKENS.GraphQLSocialLinkTransformer, GraphQLSocialLinkTransformer],
      [AUTH_TOKENS.SocialLinkProvider, SocialLinkProvider],
      [AUTH_TOKENS.GraphQLProfileRepository, GraphQLProfileRepository],
      [AUTH_TOKENS.GraphQLProfileTransformer, GraphQLProfileTransformer],
      [AUTH_TOKENS.ProfileProvider, ProfileProvider],
      [AUTH_TOKENS.GraphQLTwoFactorSettingsRepository, GraphQLTwoFactorSettingsRepository],
      [AUTH_TOKENS.GraphQLTwoFactorSettingsTransformer, GraphQLTwoFactorSettingsTransformer],
      [AUTH_TOKENS.TwoFactorSettingsProvider, TwoFactorSettingsProvider],
    ]);
  });
});
