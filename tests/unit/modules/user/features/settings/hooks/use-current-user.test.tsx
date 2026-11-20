import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router';

import useCurrentUser from '@/modules/user/features/settings/hooks/use-current-user';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import UserDisplayNameMapper from '@/modules/user/store/user-display-name-mapper';
import type { UserDisplayName } from '@/modules/user/types/lib/user-display-name';
import type {
  ProtectedSession,
  ProtectedSessionContext,
} from '@/routes/types/protected-outlet-context';
import { buildFullName } from '@tests/builders';

type CurrentUserReadOutcome = Awaited<ReturnType<typeof currentUserSource.read>>;

const mockRead = jest.fn<Promise<CurrentUserReadOutcome>, [ProtectedSession, AbortSignal]>();

const session: ProtectedSession = { token: () => null, end: () => undefined };

const context: ProtectedSessionContext = {
  signOut: () => undefined,
  session,
  twoFactorStatus: 'unknown',
  setTwoFactorStatus: () => undefined,
};

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route element={<Outlet context={context} />}>
        <Route path="*" element={children} />
      </Route>
    </Routes>
  </MemoryRouter>
);

const mapper = new UserDisplayNameMapper();
const olena = mapper.fromFullName(buildFullName());
const anna = mapper.fromFullName(buildFullName());

const named = (identity: UserDisplayName): CurrentUserReadOutcome => ({ kind: 'ok', identity });

const settle = (outcome: CurrentUserReadOutcome): void => {
  mockRead.mockResolvedValue(outcome);
};

describe('useCurrentUser', () => {
  beforeEach(() => {
    mockRead.mockReset();
    jest.spyOn(currentUserSource, 'read').mockImplementation(mockRead);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts name-less and pending, and makes one read with the outlet session', async () => {
    settle(named(olena));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current).toEqual({ status: 'pending', identity: null });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead.mock.calls[0]?.[0]).toBe(session);
    expect(mockRead.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(mockRead.mock.contexts[0]).toBe(currentUserSource);
  });

  it('shows the display name and monogram once the read is ok', async () => {
    settle(named(olena));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        identity: olena,
      })
    );
  });

  it('stays name-less when the read is unavailable', async () => {
    settle({ kind: 'failed', reason: 'unavailable' });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(result.current).toEqual({ status: 'failed', identity: null }));
  });

  it('leaves a session_ended read to the ended session and stays pending', async () => {
    settle({ kind: 'failed', reason: 'session_ended' });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    await act(async () => undefined);

    expect(result.current).toEqual({ status: 'pending', identity: null });
  });

  it('aborts the read when it unmounts and settles its late outcome without error', async () => {
    let resolve: (outcome: CurrentUserReadOutcome) => void = () => undefined;
    mockRead.mockImplementation(
      () =>
        new Promise<CurrentUserReadOutcome>((done) => {
          resolve = done;
        })
    );
    const { unmount } = renderHook(() => useCurrentUser(), { wrapper });
    const signal = mockRead.mock.calls[0]?.[1] as AbortSignal;
    expect(signal.aborted).toBe(false);

    unmount();
    await act(async () => resolve(named(anna)));

    expect(signal.aborted).toBe(true);
  });

  const renderNavigable = (): {
    result: { current: { state: ReturnType<typeof useCurrentUser>; go: (to: string) => void } };
  } =>
    renderHook(
      () => {
        const navigate = useNavigate();

        return { state: useCurrentUser(), go: (to: string): void => void navigate(to) };
      },
      { wrapper }
    );

  const NAMED = {
    status: 'ready',
    identity: olena,
  } as const;

  it('re-reads on a pathname change and drops the late answer of the read in flight', async () => {
    const answers: Array<(outcome: CurrentUserReadOutcome) => void> = [];
    mockRead.mockImplementation(
      () =>
        new Promise<CurrentUserReadOutcome>((done) => {
          answers.push(done);
        })
    );
    const { result } = renderNavigable();
    const first = mockRead.mock.calls[0]?.[1] as AbortSignal;

    act(() => result.current.go('/boards'));
    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
    await act(async () => answers[1]?.(named(anna)));
    await act(async () => answers[0]?.(named(olena)));

    expect(first.aborted).toBe(true);
    expect(result.current.state).toEqual({
      status: 'ready',
      identity: anna,
    });
  });

  it('keeps the last good name when a later re-read is unavailable', async () => {
    settle(named(olena));
    const { result } = renderNavigable();
    await waitFor(() => expect(result.current.state).toEqual(NAMED));
    settle({ kind: 'failed', reason: 'unavailable' });

    act(() => result.current.go('/boards'));

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
    await act(async () => undefined);
    expect(result.current.state).toEqual(NAMED);
  });

  it('clears the shown name when a later re-read reports the session ended', async () => {
    settle(named(olena));
    const { result } = renderNavigable();
    await waitFor(() => expect(result.current.state).toEqual(NAMED));
    settle({ kind: 'failed', reason: 'session_ended' });

    act(() => result.current.go('/boards'));

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: 'pending', identity: null })
    );
  });

  it('stays name-less when a re-read after a failed first read fails again', async () => {
    settle({ kind: 'failed', reason: 'unavailable' });
    const { result } = renderNavigable();
    await waitFor(() => expect(result.current.state.status).toBe('failed'));

    act(() => result.current.go('/boards'));

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
    await act(async () => undefined);
    expect(result.current.state).toEqual({ status: 'failed', identity: null });
  });

  it('never shows the previous user on a fresh mount, not even for one render', async () => {
    settle(named(anna));
    const { result: before, unmount } = renderHook(() => useCurrentUser(), { wrapper });
    await waitFor(() => expect(before.current.status).toBe('ready'));
    unmount();
    mockRead.mockReturnValue(new Promise(() => undefined));

    const { result: after } = renderHook(() => useCurrentUser(), { wrapper });

    expect(after.current).toEqual({ status: 'pending', identity: null });
  });
});
