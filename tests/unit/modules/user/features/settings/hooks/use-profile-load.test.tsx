import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode, type JSX, type ReactNode } from 'react';

import useProfileLoad from '@/modules/user/features/settings/hooks/use-profile-load';
import type {
  ProfileFailedOutcome,
  ProfileReadOutcome,
} from '@/modules/user/features/settings/types/user-profile';
import { buildUserEntity } from '@tests/builders';

const mockRead = jest.fn();
const mockProvider = { read: mockRead };

jest.mock('@/providers/di', () => ({
  __esModule: true,
  useService: (): object => mockProvider,
}));

const failed = (reason: ProfileFailedOutcome['reason']): ProfileReadOutcome => ({
  kind: 'failed',
  reason,
});

const deferred = (): {
  promise: Promise<ProfileReadOutcome>;
  resolve: (v: ProfileReadOutcome) => void;
} => {
  let resolve: (value: ProfileReadOutcome) => void = () => undefined;
  const promise = new Promise<ProfileReadOutcome>((settle) => {
    resolve = settle;
  });
  return { promise, resolve };
};

describe('useProfileLoad', () => {
  beforeEach(() => {
    mockRead.mockReset();
  });

  it('starts loading and sends one read with a live signal', async () => {
    mockRead.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useProfileLoad());

    expect(result.current).toMatchObject({
      status: 'loading',
      user: null,
      version: 0,
      refocus: false,
    });
    expect(mockRead).toHaveBeenCalledTimes(1);
    expect((mockRead.mock.calls[0]?.[0] as AbortSignal).aborted).toBe(false);
  });

  it('becomes ready with the entity itself when the read succeeds', async () => {
    const user = buildUserEntity();
    mockRead.mockResolvedValue({ kind: 'ok', user });

    const { result } = renderHook(() => useProfileLoad());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.user).toBe(user);
  });

  it.each(['transient', 'rejected', 'rate_limited'] as const)(
    'becomes failed when the read settles as %s',
    async (reason) => {
      mockRead.mockResolvedValue(failed(reason));

      const { result } = renderHook(() => useProfileLoad());

      await waitFor(() => expect(result.current.status).toBe('failed'));
      expect(result.current.user).toBeNull();
    }
  );

  it('renders nothing new when the read settles as session_ended', async () => {
    mockRead.mockResolvedValue(failed('session_ended'));

    const { result } = renderHook(() => useProfileLoad());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toBe('loading');
  });

  it('aborts the read on unmount and ignores its settled result', async () => {
    const pending = deferred();
    mockRead.mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useProfileLoad());
    const signal = mockRead.mock.calls[0]?.[0] as AbortSignal;

    unmount();
    await act(async () => {
      pending.resolve({ kind: 'ok', user: buildUserEntity() });
      await pending.promise;
    });

    expect(signal.aborted).toBe(true);
    expect(result.current.status).toBe('loading');
  });

  it('sends exactly one new read per retry, shows loading again and asks for refocus', async () => {
    mockRead.mockResolvedValueOnce(failed('transient'));
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('failed'));
    const pending = deferred();
    mockRead.mockReturnValueOnce(pending.promise);

    act(() => result.current.retry());

    expect(mockRead).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ status: 'loading', refocus: true });
    const user = buildUserEntity();
    await act(async () => {
      pending.resolve({ kind: 'ok', user });
      await pending.promise;
    });
    expect(result.current).toMatchObject({ status: 'ready', refocus: true });
    expect(result.current.user).toBe(user);
  });

  it('aborts the first attempt when a retry starts', async () => {
    mockRead.mockResolvedValueOnce(failed('transient'));
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('failed'));
    const firstSignal = mockRead.mock.calls[0]?.[0] as AbortSignal;
    mockRead.mockReturnValueOnce(new Promise(() => undefined));

    act(() => result.current.retry());

    expect(firstSignal.aborted).toBe(true);
  });

  it('adopts a new entity, bumps the version, clears refocus and sends no read', async () => {
    mockRead.mockResolvedValue({ kind: 'ok', user: buildUserEntity() });
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const reads = mockRead.mock.calls.length;
    const next = buildUserEntity();

    act(() => result.current.adoption.adopt(next));

    expect(result.current.user).toBe(next);
    expect(result.current.version).toBe(1);
    expect(result.current.refocus).toBe(false);
    expect(mockRead).toHaveBeenCalledTimes(reads);
  });

  it('confirms only the confirmed flag without bumping the version or reading', async () => {
    const user = buildUserEntity({ confirmed: false });
    mockRead.mockResolvedValue({ kind: 'ok', user });
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.adoption.confirm(user.email, true));

    expect(result.current.user).toEqual({ ...user, confirmed: true });
    expect(result.current.version).toBe(0);
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('ignores a resend that settles after a Save adopted another e-mail', async () => {
    const user = buildUserEntity({ confirmed: false });
    const saved = buildUserEntity({ id: user.id, confirmed: false });
    mockRead.mockResolvedValue({ kind: 'ok', user });
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.adoption.adopt(saved));
    act(() => result.current.adoption.confirm(user.email, true));

    expect(saved.email).not.toBe(user.email);
    expect(result.current.user).toBe(saved);
    expect(result.current.user?.confirmed).toBe(false);
    expect(result.current.version).toBe(1);
  });

  it('treats the loaded e-mail as current until a Save adopts another one', async () => {
    const user = buildUserEntity({ confirmed: false });
    mockRead.mockResolvedValue({ kind: 'ok', user });
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.adoption.isCurrent(user.email)).toBe(true);
  });

  it('reports a replaced e-mail as stale in the same tick the adoption is dispatched', async () => {
    const user = buildUserEntity({ confirmed: false });
    const saved = buildUserEntity({ id: user.id, confirmed: false });
    mockRead.mockResolvedValue({ kind: 'ok', user });
    const { result } = renderHook(() => useProfileLoad());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const { adoption } = result.current;
    let beforeCommit: boolean[] = [];

    act(() => {
      adoption.adopt(saved);
      beforeCommit = [adoption.isCurrent(user.email), adoption.isCurrent(saved.email)];
    });

    expect(beforeCommit).toEqual([false, true]);
    expect(result.current.adoption.isCurrent(user.email)).toBe(false);
    expect(result.current.adoption.isCurrent(saved.email)).toBe(true);
  });

  it('keeps no entity when a confirmation arrives before one is loaded', () => {
    mockRead.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useProfileLoad());

    act(() => result.current.adoption.confirm(buildUserEntity().email, true));

    expect(result.current.user).toBeNull();
  });

  it('renders the card state under StrictMode when the read resolves', async () => {
    const user = buildUserEntity();
    mockRead.mockResolvedValue({ kind: 'ok', user });
    const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
      <StrictMode>{children}</StrictMode>
    );

    const { result } = renderHook(() => useProfileLoad(), { wrapper });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.user).toBe(user);
  });
});
