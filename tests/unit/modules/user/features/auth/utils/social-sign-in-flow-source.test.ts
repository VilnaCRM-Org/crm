import type SocialSignInFlowSourceModule from '@auth/utils/social-sign-in-flow-source';
import loadIsolated from '@tests/unit/utils/isolated-module';

const DESTINATION_KEY = 'crm.socialSignIn.destination';
const STATE_KEY = 'crm.socialSignIn.state';
const from = (pathname: string, search = '', hash = ''): unknown => ({
  from: { pathname, search, hash },
});

// The storage keys are module-level literals, so the source is loaded inside each test.
let socialSignInFlowSource: typeof SocialSignInFlowSourceModule;

describe('socialSignInFlowSource', () => {
  beforeEach(async () => {
    socialSignInFlowSource = await loadIsolated(
      async () => (await import('@auth/utils/social-sign-in-flow-source')).default
    );
  });

  afterEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('keeps an internal destination, with its query and hash, for one read', () => {
    socialSignInFlowSource.saveDestination(from('/settings', '?tab=2', '#security'));

    expect(window.sessionStorage.getItem(DESTINATION_KEY)).toBe('/settings?tab=2#security');
    expect(socialSignInFlowSource.takeDestination()).toBe('/settings?tab=2#security');
    expect(window.sessionStorage.getItem(DESTINATION_KEY)).toBeNull();
    expect(socialSignInFlowSource.takeDestination()).toBe('/');
  });

  it('stores home when the router state names no safe destination', () => {
    socialSignInFlowSource.saveDestination(from('//evil.example'));

    expect(window.sessionStorage.getItem(DESTINATION_KEY)).toBe('/');
  });

  it.each([
    ['an absolute URL', 'https://evil.example/'],
    ['a protocol-relative path', '//evil.example'],
    ['a backslash path', '/\\evil.example'],
    ['the sign-in page', '/sign-in'],
    ['a relative path', 'settings'],
  ])('re-validates %s planted in storage and falls back to home', (_label, planted) => {
    window.sessionStorage.setItem(DESTINATION_KEY, planted);

    expect(socialSignInFlowSource.takeDestination()).toBe('/');
  });

  it('hands the saved destination to the 2FA challenge as from, for one read', () => {
    socialSignInFlowSource.saveDestination(from('/settings', '?tab=2', '#security'));

    expect(socialSignInFlowSource.takeChallengeState()).toEqual(
      from('/settings', '?tab=2', '#security')
    );
    expect(window.sessionStorage.getItem(DESTINATION_KEY)).toBeNull();
    expect(socialSignInFlowSource.takeChallengeState()).toEqual(from('/'));
  });

  it('hands the challenge home when the stored destination is not safe', () => {
    window.sessionStorage.setItem(DESTINATION_KEY, '//evil.example');

    expect(socialSignInFlowSource.takeChallengeState()).toEqual(from('/'));
  });

  it('matches only the state saved for the same provider, without consuming it', () => {
    socialSignInFlowSource.saveState({ provider: 'google', state: 's-1' });

    expect(window.sessionStorage.getItem(STATE_KEY)).toBe('google:s-1');
    expect(socialSignInFlowSource.matchesState({ provider: 'google', state: 's-1' })).toBe(true);
    expect(socialSignInFlowSource.matchesState({ provider: 'google', state: 's-1' })).toBe(true);
    expect(socialSignInFlowSource.matchesState({ provider: 'github', state: 's-1' })).toBe(false);
    expect(socialSignInFlowSource.matchesState({ provider: 'google', state: 's-2' })).toBe(false);
  });

  it('matches nothing when no state was saved', () => {
    expect(socialSignInFlowSource.matchesState({ provider: 'google', state: 's-1' })).toBe(false);
  });

  it('falls back safely and never throws when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => socialSignInFlowSource.saveDestination(from('/settings'))).not.toThrow();
    expect(() =>
      socialSignInFlowSource.saveState({ provider: 'google', state: 's' })
    ).not.toThrow();
    expect(socialSignInFlowSource.takeDestination()).toBe('/');
    expect(socialSignInFlowSource.matchesState({ provider: 'google', state: 's' })).toBe(false);
  });
});
