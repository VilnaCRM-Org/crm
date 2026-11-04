import 'reflect-metadata';

import ProfileProvider, {
  TwoFactorSettingsProvider,
} from '@/modules/user/features/settings/data-providers';

describe('settings data-providers barrel', () => {
  it('re-exports the profile provider as its default', () => {
    expect(ProfileProvider.name).toBe('ProfileProvider');
  });

  it('re-exports the two-factor settings provider by name', () => {
    expect(TwoFactorSettingsProvider.name).toBe('TwoFactorSettingsProvider');
  });
});
