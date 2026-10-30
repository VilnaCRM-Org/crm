import { act, renderHook } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import {
  type Location,
  MemoryRouter,
  type NavigationType,
  useLocation,
  useNavigationType,
} from 'react-router';

import ROUTE_PATHS from '@/routes/route-paths';
import useChallengeBack from '@auth/hooks/use-challenge-back';

interface WrapperProps {
  readonly children: ReactNode;
}

const wrapperFor = (state: object | null): ((props: WrapperProps) => JSX.Element) => {
  function RouterWrapper({ children }: WrapperProps): JSX.Element {
    return (
      <MemoryRouter initialEntries={[{ pathname: ROUTE_PATHS.twoFactorChallenge, state }]}>
        {children}
      </MemoryRouter>
    );
  }
  return RouterWrapper;
};

interface MountedBack {
  readonly back: () => void;
  readonly location: () => Location;
  readonly navigationType: () => NavigationType;
}

const mount = (state: object | null): MountedBack => {
  const { result } = renderHook(
    () => ({
      back: useChallengeBack(),
      location: useLocation(),
      navigationType: useNavigationType(),
    }),
    { wrapper: wrapperFor(state) }
  );
  return {
    back: () => result.current.back(),
    location: () => result.current.location,
    navigationType: () => result.current.navigationType,
  };
};

describe('useChallengeBack', () => {
  it('goes to sign-in keeping the from target and asking for main focus', () => {
    const from = { pathname: '/boards', search: '?a=1', hash: '#x' };
    const { back, location } = mount({ from, notice: 'session_ended' });

    act(() => back());

    expect(location().pathname).toBe(ROUTE_PATHS.signIn);
    expect(location().state).toEqual({ from, focusMain: true });
  });

  it('goes to sign-in with only the focus marker when there is no from target', () => {
    const { back, location } = mount(null);

    act(() => back());

    expect(location().pathname).toBe(ROUTE_PATHS.signIn);
    expect(location().state).toStrictEqual({ focusMain: true });
  });

  it('pushes a history entry rather than replacing the challenge', () => {
    const { back, location, navigationType } = mount(null);
    const key = location().key;

    act(() => back());

    expect(navigationType()).toBe('PUSH');
    expect(location().key).not.toBe(key);
  });
});
