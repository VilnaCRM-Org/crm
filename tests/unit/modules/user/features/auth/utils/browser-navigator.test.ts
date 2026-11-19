import browserNavigator, { BrowserNavigator } from '@auth/utils/browser-navigator';

describe('browserNavigator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('replaces the current history entry in this tab, never a new one', () => {
    const replace = jest.fn();
    const open = jest.spyOn(window, 'open');

    new BrowserNavigator({ replace } as unknown as Location).replace('https://github.com/login');

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('https://github.com/login');
    expect(open).not.toHaveBeenCalled();
  });

  it('is bound to the window location', () => {
    browserNavigator.replace('#social-sign-in');

    expect(browserNavigator).toBeInstanceOf(BrowserNavigator);
    expect(window.location.hash).toBe('#social-sign-in');
    window.location.hash = '';
  });
});
