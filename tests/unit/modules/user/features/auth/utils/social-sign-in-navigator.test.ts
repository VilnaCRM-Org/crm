import API_ENDPOINTS from '@/config/api-config';
import browserNavigator from '@auth/utils/browser-navigator';
import socialSignInDestinationSource from '@auth/utils/social-sign-in-destination-source';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

describe('socialSignInNavigator', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves the destination, then navigates to the initiate endpoint', () => {
    const save = jest
      .spyOn(socialSignInDestinationSource, 'save')
      .mockImplementation(() => undefined);
    const assign = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);
    const routerState = { from: { pathname: '/orders' } };

    socialSignInNavigator.start('google', routerState);

    expect(save).toHaveBeenCalledWith(routerState);
    expect(assign).toHaveBeenCalledWith(`${API_ENDPOINTS.SOCIAL_AUTH}/google`);
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(assign.mock.invocationCallOrder[0] ?? 0);
  });

  it('restarts without overwriting the saved destination', () => {
    const save = jest.spyOn(socialSignInDestinationSource, 'save');
    const assign = jest.spyOn(browserNavigator, 'assign').mockImplementation(() => undefined);

    socialSignInNavigator.restart('github');

    expect(assign).toHaveBeenCalledWith(`${API_ENDPOINTS.SOCIAL_AUTH}/github`);
    expect(save).not.toHaveBeenCalled();
  });
});
