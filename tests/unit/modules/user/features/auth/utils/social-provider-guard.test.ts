import socialProviderGuard from '@auth/utils/social-provider-guard';

describe('socialProviderGuard', () => {
  it.each(['google', 'github', 'facebook', 'twitter'])('accepts %s', (provider) => {
    expect(socialProviderGuard.isSocialProvider(provider)).toBe(true);
  });

  it.each([undefined, '', 'Google', 'myspace', 42, null])('rejects %p', (value) => {
    expect(socialProviderGuard.isSocialProvider(value)).toBe(false);
  });
});
