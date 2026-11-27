import type Guard from '@/modules/user/lib/social-link/social-link-state-guard';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

describe('socialLinkStateGuard', () => {
  let socialLinkStateGuard: typeof Guard;

  beforeEach(async () => {
    socialLinkStateGuard = await loadIsolated(
      async () => (await import('@/modules/user/lib/social-link/social-link-state-guard')).default
    );
  });

  it('recognises a state user-service marked as a link', () => {
    expect(socialLinkStateGuard.isLinkState(`link.${buildToken()}`)).toBe(true);
  });

  it.each([
    ['a missing state', null],
    ['an empty state', ''],
    ['a sign-in state', buildToken()],
    ['a state that only contains the mark', 'a-link.b'],
  ])('does not recognise %s', (_name, state) => {
    expect(socialLinkStateGuard.isLinkState(state)).toBe(false);
  });
});
