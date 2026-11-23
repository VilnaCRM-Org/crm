import 'reflect-metadata';

import GraphQLProfileRepository, {
  GraphQLSocialLinkRepository,
  GraphQLTwoFactorSettingsRepository,
} from '@/modules/user/features/settings/repositories';

describe('settings repositories barrel', () => {
  it('re-exports the profile repository as its default', () => {
    expect(GraphQLProfileRepository.name).toBe('GraphQLProfileRepository');
  });

  it('re-exports the social link repository by name', () => {
    expect(GraphQLSocialLinkRepository.name).toBe('GraphQLSocialLinkRepository');
  });

  it('re-exports the two-factor settings repository by name', () => {
    expect(GraphQLTwoFactorSettingsRepository.name).toBe('GraphQLTwoFactorSettingsRepository');
  });
});
