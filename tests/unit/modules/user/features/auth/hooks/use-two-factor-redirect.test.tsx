import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { type Location, MemoryRouter, useLocation } from 'react-router';

import ROUTE_PATHS from '@/routes/route-paths';
import useTwoFactorRedirect from '@auth/hooks/use-two-factor-redirect';
import useAuthStore from '@auth/stores/use-auth-store';
import { buildPendingSessionId } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

interface WrapperProps {
  readonly children: ReactNode;
}

const wrapperFor = (state: object | null): ((props: WrapperProps) => JSX.Element) => {
  function RouterWrapper({ children }: WrapperProps): JSX.Element {
    return (
      <MemoryRouter initialEntries={[{ pathname: ROUTE_PATHS.signIn, state }]}>
        {children}
      </MemoryRouter>
    );
  }
  return RouterWrapper;
};

const mount = (state: object | null = null): RenderHookResult<Location, unknown> =>
  renderHook(
    () => {
      useTwoFactorRedirect();
      return useLocation();
    },
    { wrapper: wrapperFor(state) }
  );

describe('useTwoFactorRedirect', () => {
  const pendingSessionId = buildPendingSessionId();

  beforeEach(() => {
    resetClientStores();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('discards a pending session on its first run and does not navigate', () => {
    useAuthStore.setState({ pendingSessionId });

    const { result } = mount();

    expect(useAuthStore.getState().pendingSessionId).toBeNull();
    expect(result.current.pathname).toBe(ROUTE_PATHS.signIn);
  });

  it('writes nothing on its first run when there is no pending session', () => {
    const setState = jest.spyOn(useAuthStore, 'setState');

    mount();

    expect(setState).not.toHaveBeenCalled();
  });

  it('navigates once to the challenge with the from target only when a session appears', () => {
    const from = { pathname: '/boards', search: '?a=1', hash: '#x' };
    const { result } = mount({ from, focusMain: true, notice: 'session_ended' });

    act(() => useAuthStore.setState({ pendingSessionId }));

    expect(result.current.pathname).toBe(ROUTE_PATHS.twoFactorChallenge);
    expect(result.current.state).toEqual({ from });
    expect(JSON.stringify(result.current)).not.toContain(pendingSessionId);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('navigates with an empty state when there is no from target', () => {
    const { result } = mount(null);

    act(() => useAuthStore.setState({ pendingSessionId }));

    expect(result.current.pathname).toBe(ROUTE_PATHS.twoFactorChallenge);
    expect(result.current.state).toEqual({});
  });

  it('navigates only on the false-to-true edge', () => {
    const { result } = mount(null);
    act(() => useAuthStore.setState({ pendingSessionId }));
    const key = result.current.key;

    act(() => useAuthStore.setState({ email: 'someone@example.com' }));

    expect(result.current.key).toBe(key);
  });

  it('does not navigate when the session disappears', () => {
    const { result } = mount(null);
    act(() => useAuthStore.setState({ pendingSessionId }));
    act(() => useAuthStore.setState({ pendingSessionId: null }));

    expect(result.current.pathname).toBe(ROUTE_PATHS.twoFactorChallenge);
  });

  it('navigates again for a later false-to-true edge', () => {
    const { result } = mount(null);
    act(() => useAuthStore.setState({ pendingSessionId }));
    const first = result.current.key;
    act(() => useAuthStore.setState({ pendingSessionId: null }));

    act(() => useAuthStore.setState({ pendingSessionId: buildPendingSessionId() }));

    expect(result.current.key).not.toBe(first);
  });
});
