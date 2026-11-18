import browserNavigator, { BrowserNavigator } from '@auth/utils/browser-navigator';

describe('browserNavigator', () => {
  it('navigates the current tab, never a new one', () => {
    const assign = jest.fn();
    const open = jest.spyOn(window, 'open');

    new BrowserNavigator({ assign } as unknown as Location).assign('/api/auth/social/google');

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/api/auth/social/google');
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it('is bound to the window location', () => {
    browserNavigator.assign('#social-sign-in');

    expect(browserNavigator).toBeInstanceOf(BrowserNavigator);
    expect(window.location.hash).toBe('#social-sign-in');
    window.location.hash = '';
  });
});
