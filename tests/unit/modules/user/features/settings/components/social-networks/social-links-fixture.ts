import type { SocialLinks } from '@/modules/user/features/settings/types/social-link/social-links';

const buildSocialLinks = (overrides: Partial<SocialLinks> = {}): SocialLinks => ({
  status: 'ready',
  linked: { items: [] },
  busy: false,
  link: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
  retry: jest.fn(),
  ...overrides,
});

export default buildSocialLinks;
