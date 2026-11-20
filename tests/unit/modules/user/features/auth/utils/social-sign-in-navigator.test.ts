import browserNavigator from '@auth/utils/browser-navigator';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

describe('socialSignInNavigator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves the destination, then opens the callback page to start the flow', () => {
    const save = jest
      .spyOn(socialSignInFlowSource, 'saveDestination')
      .mockImplementation(() => undefined);
    const navigate = jest.fn();
    const routerState = { from: { pathname: '/orders' } };

    socialSignInNavigator.start('google', routerState, navigate);

    expect(save).toHaveBeenCalledWith(routerState);
    expect(navigate).toHaveBeenCalledWith('/auth/callback/google', {
      state: { socialStart: true },
    });
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(
      navigate.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('restarts without overwriting the saved destination', () => {
    const save = jest.spyOn(socialSignInFlowSource, 'saveDestination');
    const navigate = jest.fn();

    socialSignInNavigator.restart('github', navigate);

    expect(navigate).toHaveBeenCalledWith('/auth/callback/github', {
      replace: true,
      state: { socialStart: true },
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('leaves for the authorization URL in the same tab, replacing the start entry', () => {
    const replace = jest.spyOn(browserNavigator, 'replace').mockImplementation(() => undefined);

    socialSignInNavigator.leave('https://github.com/login/oauth/authorize?state=s');

    expect(replace).toHaveBeenCalledWith('https://github.com/login/oauth/authorize?state=s');
  });
});
