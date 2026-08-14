import browserNavigator from '@auth/utils/browser-navigator';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('browserNavigator', () => {
  it('opens the url in a new tab with noopener/noreferrer', () => {
    const openSpy = jest
      .spyOn(window, 'open')
      .mockReturnValue({} as ReturnType<typeof window.open>);
    const assignSpy = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);

    browserNavigator.openInNewTab('/auth/google');

    expect(openSpy).toHaveBeenCalledWith('/auth/google', '_blank', 'noopener,noreferrer');
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('falls back to same-tab navigation when the popup is blocked', () => {
    jest.spyOn(window, 'open').mockReturnValue(null);
    const assignSpy = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);

    browserNavigator.openInNewTab('/auth/github');

    expect(assignSpy).toHaveBeenCalledWith('/auth/github');
  });

  it('assigns window.location.href', () => {
    browserNavigator.assign('#post-login');

    expect(window.location.href).toContain('#post-login');
  });
});
