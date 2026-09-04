import browserNavigator from '@auth/utils/browser-navigator';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('browserNavigator', () => {
  it('opens the url in a new tab with noopener/noreferrer', () => {
    const openSpy = jest
      .spyOn(window, 'open')
      .mockReturnValue({} as ReturnType<typeof window.open>);

    browserNavigator.openInNewTab('/auth/google');

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('/auth/google', '_blank', 'noopener,noreferrer');
  });

  // `noopener` makes several browsers return `null` from a successful `window.open`, so a null
  // handle is not evidence the popup was blocked. The current tab must stay where it is.
  it('leaves the current tab alone when window.open returns no handle', () => {
    const openSpy = jest.spyOn(window, 'open').mockReturnValue(null);
    const hrefBefore = window.location.href;

    browserNavigator.openInNewTab('/auth/github');

    expect(openSpy).toHaveBeenCalledWith('/auth/github', '_blank', 'noopener,noreferrer');
    expect(window.location.href).toBe(hrefBefore);
  });
});
