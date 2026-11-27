import type { SocialLinkProvider } from '@/modules/user/features/settings/data-providers';
import type {
  SocialLinkDeps,
  SocialLinkTarget,
} from '@/modules/user/features/settings/types/social-link/social-links';

export interface SocialLinkTestDeps {
  readonly deps: SocialLinkDeps;
  readonly start: jest.Mock;
  readonly complete: jest.Mock;
  readonly unlink: jest.Mock;
  readonly settle: jest.Mock;
  readonly hold: jest.Mock;
  readonly isHeld: jest.Mock;
}

export const google: SocialLinkTarget = {
  id: 'google',
  label: 'Google',
  controlRef: { current: null },
};

export const github: SocialLinkTarget = {
  id: 'github',
  label: 'GitHub',
  controlRef: { current: null },
};

export const buildSocialLinkDeps = (): SocialLinkTestDeps => {
  const provider = { start: jest.fn(), complete: jest.fn(), unlink: jest.fn() };
  const settle = jest.fn();
  const hold = jest.fn((work: Promise<unknown>) => work);
  const isHeld = jest.fn(() => false);
  return {
    ...provider,
    settle,
    hold,
    isHeld,
    deps: {
      provider: provider as unknown as SocialLinkProvider,
      settle,
      busy: { busy: false, hold: hold as unknown as SocialLinkDeps['busy']['hold'], isHeld },
    },
  };
};
