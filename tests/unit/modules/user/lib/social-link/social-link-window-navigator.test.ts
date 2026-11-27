import type WindowNavigator from '@/modules/user/lib/social-link/social-link-window-navigator';
import loadIsolated from '@tests/unit/utils/isolated-module';

describe('socialLinkWindowNavigator', () => {
  let socialLinkWindowNavigator: typeof WindowNavigator;

  beforeEach(async () => {
    socialLinkWindowNavigator = await loadIsolated(
      async () =>
        (await import('@/modules/user/lib/social-link/social-link-window-navigator')).default
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('opens an empty sized popup that cannot reach the settings tab', () => {
    const popup = { opener: window } as unknown as Window;
    const open = jest.spyOn(window, 'open').mockReturnValue(popup);

    expect(socialLinkWindowNavigator.open()).toBe(popup);
    expect(open).toHaveBeenCalledWith('', '_blank', 'popup,width=520,height=680');
    expect(popup.opener).toBeNull();
  });

  it('returns null when the browser blocks the popup', () => {
    jest.spyOn(window, 'open').mockReturnValue(null);

    expect(socialLinkWindowNavigator.open()).toBeNull();
  });

  it('sends the popup to the provider without a history entry to come back to', () => {
    const popup = { closed: false, location: { replace: jest.fn() }, close: jest.fn() };

    socialLinkWindowNavigator.leave(popup, 'https://provider.example/authorize');

    expect(popup.location.replace.mock.calls).toEqual([['https://provider.example/authorize']]);
  });
});
