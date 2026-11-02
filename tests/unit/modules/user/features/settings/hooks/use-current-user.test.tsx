import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router';

import useCurrentUser from '@/modules/user/features/settings/hooks/use-current-user';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import type {
  ProtectedSession,
  ProtectedSessionContext,
} from '@/routes/types/protected-outlet-context';

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

const named = (displayName: string, monogram: string): CurrentUserReadOutcome => ({
  kind: 'ok',
  identity: { displayName, monogram },
});

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
    settle(named('Олена Петренко', 'ОП'));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current).toEqual({ status: 'pending', identity: null });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead.mock.calls[0]?.[0]).toBe(session);
    expect(mockRead.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(mockRead.mock.contexts[0]).toBe(currentUserSource);
  });

  it('shows the display name and monogram once the read is ok', async () => {
    settle(named('Олена Петренко', 'ОП'));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        identity: { displayName: 'Олена Петренко', monogram: 'ОП' },
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

  it('aborts the read and ignores its outcome when it unmounts', async () => {
    let resolve: (outcome: CurrentUserReadOutcome) => void = () => undefined;
    mockRead.mockImplementation(
      () =>
        new Promise<CurrentUserReadOutcome>((done) => {
          resolve = done;
        })
    );
    const { result, unmount } = renderHook(() => useCurrentUser(), { wrapper });
    const signal = mockRead.mock.calls[0]?.[1] as AbortSignal;

    unmount();
    await act(async () => resolve(named('Анна Коваль', 'АК')));

    expect(signal.aborted).toBe(true);
    expect(result.current).toEqual({ status: 'pending', identity: null });
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
    identity: { displayName: 'Олена Петренко', monogram: 'ОП' },
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
    await act(async () => answers[1]?.(named('Анна Коваль', 'АК')));
    await act(async () => answers[0]?.(named('Олена Петренко', 'ОП')));

    expect(first.aborted).toBe(true);
    expect(result.current.state).toEqual({
      status: 'ready',
      identity: { displayName: 'Анна Коваль', monogram: 'АК' },
    });
  });

  it('keeps the last good name when a later re-read is unavailable', async () => {
    settle(named('Олена Петренко', 'ОП'));
    const { result } = renderNavigable();
    await waitFor(() => expect(result.current.state).toEqual(NAMED));
    settle({ kind: 'failed', reason: 'unavailable' });

    act(() => result.current.go('/boards'));

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
    await act(async () => undefined);
    expect(result.current.state).toEqual(NAMED);
  });

  it('clears the shown name when a later re-read reports the session ended', async () => {
    settle(named('Олена Петренко', 'ОП'));
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
    settle(named('Анна Коваль', 'АК'));
    const { result: before, unmount } = renderHook(() => useCurrentUser(), { wrapper });
    await waitFor(() => expect(before.current.status).toBe('ready'));
    unmount();
    mockRead.mockReturnValue(new Promise(() => undefined));

    const { result: after } = renderHook(() => useCurrentUser(), { wrapper });

    expect(after.current).toEqual({ status: 'pending', identity: null });
  });
});
