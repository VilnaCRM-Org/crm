import browserNavigator from '@auth/utils/browser-navigator';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

describe('socialSignInNavigator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.history.replaceState(null, '', '/');
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

  it('spends the start marker and keeps the rest of the history entry', () => {
    window.history.replaceState(
      { usr: { socialStart: true }, key: 'k', idx: 2 },
      '',
      '/auth/callback/google'
    );
    const replace = jest.spyOn(window.history, 'replaceState');

    socialSignInNavigator.consumeStart();
    socialSignInNavigator.consumeStart();

    expect(window.history.state).toEqual({ usr: null, key: 'k', idx: 2 });
    expect(window.location.pathname).toBe('/auth/callback/google');
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['no history state', null],
    ['no router state', { usr: null, key: 'k', idx: 2 }],
    ['another router state', { usr: { socialStart: 'yes' }, key: 'k', idx: 2 }],
  ])('leaves an entry with %s alone', (_, state) => {
    window.history.replaceState(state, '', '/auth/callback/google');
    const replace = jest.spyOn(window.history, 'replaceState');

    socialSignInNavigator.consumeStart();

    expect(replace).not.toHaveBeenCalled();
    expect(window.history.state).toEqual(state);
  });

  it('leaves for the authorization URL in the same tab, replacing the start entry', () => {
    const replace = jest.spyOn(browserNavigator, 'replace').mockImplementation(() => undefined);

    socialSignInNavigator.leave('https://github.com/login/oauth/authorize?state=s');

    expect(replace).toHaveBeenCalledWith('https://github.com/login/oauth/authorize?state=s');
  });
});
