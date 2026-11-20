import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigationType } from 'react-router';

import useSocialCallback from '@auth/hooks/use-social-callback';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';
import socialSignInNavigator from '@auth/utils/social-sign-in-navigator';

const mockStart = jest.fn();
const mockComplete = jest.fn();
const mockLoader = { resolve: jest.fn() };

jest.mock('@auth/hooks/use-auth-provider-loader', () => ({
  __esModule: true,
  default: (): unknown => mockLoader,
}));

interface Landing {
  pathname: string;
  state: unknown;
  type: string;
}

const locations: string[] = [];
const landings: Landing[] = [];

function LocationProbe(): null {
  const { pathname, state } = useLocation();
  const type = useNavigationType();
  locations.push(pathname);
  landings.push({ pathname, state, type });
  return null;
}

let entryCounter = 0;

// Each test opens its own history entry, as a real navigation does; the start relay is keyed by it.
function wrapperFor(path: string, state: unknown): (props: { children: ReactNode }) => JSX.Element {
  entryCounter += 1;
  const key = `entry-${entryCounter}`;
  return function CallbackRoute({ children }: { children: ReactNode }): JSX.Element {
    return (
      <MemoryRouter initialEntries={[{ pathname: path, state, key }]}>
        <Routes>
          <Route path="/auth/callback/:provider" element={<>{children}</>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );
  };
}

const render = (
  path: string,
  search: string,
  state: unknown = null
): ReturnType<typeof renderHook<ReturnType<typeof useSocialCallback>, unknown>> => {
  window.history.replaceState({ idx: 1 }, '', `${path}${search}`);
  return renderHook(() => useSocialCallback(), { wrapper: wrapperFor(path, state) });
};

describe('useSocialCallback', () => {
  beforeEach(() => {
    locations.length = 0;
    landings.length = 0;
    mockStart.mockReset();
    mockComplete.mockReset();
    mockLoader.resolve.mockReset().mockResolvedValue({ start: mockStart, complete: mockComplete });
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    jest.restoreAllMocks();
  });

  it('opens in the starting view when the router state asks for a start', () => {
    mockStart.mockReturnValue(new Promise(() => undefined));

    const { result } = render('/auth/callback/google', '', { socialStart: true });

    expect(result.current.view).toEqual({
      status: 'starting',
      provider: 'google',
      label: 'Google',
    });
  });

  it('treats any other router state as a provider redirect back', () => {
    const { result } = render('/auth/callback/google', '', { socialStart: 'yes' });

    expect(result.current.view).toMatchObject({ status: 'failed', error: 'missing_parameters' });
    expect(mockLoader.resolve).not.toHaveBeenCalled();
  });

  it('strips the query string once the view is decided', () => {
    const strip = jest.spyOn(socialCallbackViewMapper, 'stripQuery');

    render('/auth/callback/google', '?error=access_denied&state=s');

    expect(strip).toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });

  it('leaves for the authorization URL after a successful start', async () => {
    const leave = jest.spyOn(socialSignInNavigator, 'leave').mockImplementation(() => undefined);
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?state=hook';
    mockStart.mockResolvedValue({ kind: 'redirect', authorizationUrl: url, state: 'hook' });

    render('/auth/callback/google', '', { socialStart: true });

    await waitFor(() => expect(leave).toHaveBeenCalledWith(url));
  });

  it('relays a matching code and state, then navigates to the saved page', async () => {
    socialSignInFlowSource.saveState({ provider: 'github', state: 'hook-2' });
    window.sessionStorage.setItem('crm.socialSignIn.destination', '/orders');
    mockComplete.mockResolvedValue({ kind: 'signed-in' });

    render('/auth/callback/github', '?code=c&state=hook-2');

    await waitFor(() => expect(locations).toContain('/orders'));
    expect(landings.find(({ pathname }) => pathname === '/orders')).toEqual({
      pathname: '/orders',
      state: { focusMain: true },
      type: 'REPLACE',
    });
    expect(mockComplete).toHaveBeenCalledWith(
      'github',
      { code: 'c', state: 'hook-2' },
      expect.any(AbortSignal)
    );
  });

  it('offers no retry for an unknown provider', () => {
    const { result } = render('/auth/callback/myspace', '', { socialStart: true });

    expect(result.current.retry).toBeUndefined();
  });

  it('retries the provider of a failed view', async () => {
    const restart = jest
      .spyOn(socialSignInNavigator, 'restart')
      .mockImplementation(() => undefined);
    mockStart.mockResolvedValue({ kind: 'failed', error: 'unavailable' });

    const { result } = render('/auth/callback/github', '', { socialStart: true });
    await waitFor(() => expect(result.current.view.status).toBe('failed'));
    act(() => result.current.retry?.());

    expect(restart).toHaveBeenCalledWith('github', expect.any(Function));
  });

  it('offers no retry while the flow is still pending', () => {
    mockStart.mockReturnValue(new Promise(() => undefined));

    const { result } = render('/auth/callback/github', '', { socialStart: true });

    expect(result.current.view.status).toBe('starting');
    expect(result.current.retry).toBeUndefined();
  });
});
