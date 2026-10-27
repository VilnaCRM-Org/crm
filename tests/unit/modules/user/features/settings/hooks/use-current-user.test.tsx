import 'reflect-metadata';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router';

import useCurrentUser from '@/modules/user/features/settings/hooks/use-current-user';
import type { ProfileReadOutcome } from '@/modules/user/features/settings/types/user-profile';
import { buildUserEntity } from '@tests/builders';

const mockRead = jest.fn();

jest.mock('@/providers/di', () => {
  const Mapper = jest.requireActual('@/modules/user/store/user-display-name-mapper').default;
  const tokens = jest.requireActual('@/modules/user/config/tokens').default;
  const mapper = new Mapper();
  const provider = { read: (signal: AbortSignal): unknown => mockRead(signal) };

  return {
    __esModule: true,
    useService: (token: symbol): unknown => (token === tokens.ProfileProvider ? provider : mapper),
  };
});

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
);

const settle = (outcome: ProfileReadOutcome): void => {
  mockRead.mockResolvedValue(outcome);
};

describe('useCurrentUser', () => {
  beforeEach(() => {
    mockRead.mockReset();
  });

  it('starts name-less and pending, and makes one read through the provider', async () => {
    settle({ kind: 'ok', user: buildUserEntity({ fullName: 'Олена Петренко' }) });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    expect(result.current).toEqual({ status: 'pending', identity: null });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect(mockRead.mock.calls[0]?.[0]).toBeInstanceOf(AbortSignal);
  });

  it('shows the display name and monogram once the read is ok', async () => {
    settle({ kind: 'ok', user: buildUserEntity({ fullName: 'Петренко Олена Іванівна' }) });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        identity: { displayName: 'Олена Петренко', monogram: 'ОП' },
      })
    );
  });

  it.each(['transient', 'rate_limited', 'rejected'] as const)(
    'stays name-less when the read fails with %s',
    async (reason) => {
      settle({ kind: 'failed', reason });

      const { result } = renderHook(() => useCurrentUser(), { wrapper });

      await waitFor(() => expect(result.current).toEqual({ status: 'failed', identity: null }));
    }
  );

  it('leaves a session_ended read to the session link and stays pending', async () => {
    settle({ kind: 'failed', reason: 'session_ended' });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });
    await act(async () => undefined);

    expect(result.current).toEqual({ status: 'pending', identity: null });
  });

  it('aborts the read and ignores its outcome when it unmounts', async () => {
    let resolve: (outcome: ProfileReadOutcome) => void = () => undefined;
    mockRead.mockImplementation(
      () =>
        new Promise<ProfileReadOutcome>((done) => {
          resolve = done;
        })
    );
    const { result, unmount } = renderHook(() => useCurrentUser(), { wrapper });
    const signal = mockRead.mock.calls[0]?.[0] as AbortSignal;

    unmount();
    await act(async () =>
      resolve({ kind: 'ok', user: buildUserEntity({ fullName: 'Анна Коваль' }) })
    );

    expect(signal.aborted).toBe(true);
    expect(result.current).toEqual({ status: 'pending', identity: null });
  });

  it('re-reads when the pathname changes and aborts the read in flight', async () => {
    settle({ kind: 'ok', user: buildUserEntity({ fullName: 'Анна Коваль' }) });
    const { result } = renderHook(
      () => {
        const navigate = useNavigate();

        return { state: useCurrentUser(), go: (to: string): void => void navigate(to) };
      },
      { wrapper }
    );
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    const first = mockRead.mock.calls[0]?.[0] as AbortSignal;

    act(() => result.current.go('/boards'));

    await waitFor(() => expect(mockRead).toHaveBeenCalledTimes(2));
    expect(first.aborted).toBe(true);
  });

  it('never shows the previous user on a fresh mount, not even for one render', async () => {
    settle({ kind: 'ok', user: buildUserEntity({ fullName: 'Анна Коваль' }) });
    const { result: before, unmount } = renderHook(() => useCurrentUser(), { wrapper });
    await waitFor(() => expect(before.current.status).toBe('ready'));
    unmount();
    mockRead.mockReturnValue(new Promise(() => undefined));

    const { result: after } = renderHook(() => useCurrentUser(), { wrapper });

    expect(after.current).toEqual({ status: 'pending', identity: null });
  });
});
