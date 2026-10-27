import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { Activity, type ReactNode } from 'react';

import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';
import { buildCredentials } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const mockRun = jest.fn();

jest.mock('@auth/hooks/use-sign-in-submit', () => ({
  __esModule: true,
  default: (): jest.Mock => mockRun,
}));

const t = ((key: string): string => key) as unknown as TFunction;

function neverSettlingLogin(signals: AbortSignal[]): void {
  mockRun.mockImplementation(
    (_data, signal?: AbortSignal): Promise<void> =>
      new Promise<void>(() => {
        signals.push(signal as AbortSignal);
      })
  );
}

describe('useLoginSubmitter request tracking', () => {
  beforeEach(() => {
    resetClientStores();
    mockRun.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stops tracking a settled request so unmounting cannot abort it', async () => {
    const signals: AbortSignal[] = [];
    mockRun.mockImplementation(async (_data, signal?: AbortSignal): Promise<void> => {
      signals.push(signal as AbortSignal);
    });

    const { result, unmount } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin(buildCredentials());
    });

    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(false);

    unmount();

    expect(signals[0]?.aborted).toBe(false);
  });

  it('aborts a request that is still in flight when the form unmounts', () => {
    const signals: AbortSignal[] = [];
    neverSettlingLogin(signals);

    const { result, unmount } = renderHook(() => useLoginSubmitter(t));

    act(() => {
      void result.current.handleLogin(buildCredentials());
    });

    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(false);

    unmount();

    expect(signals[0]?.aborted).toBe(true);
  });

  it('forgets aborted requests, so a later cleanup of the same form aborts only newer ones', () => {
    const signals: AbortSignal[] = [];
    neverSettlingLogin(signals);
    const abort = jest.spyOn(AbortController.prototype, 'abort');
    let mode: 'visible' | 'hidden' = 'visible';
    const wrapper = ({ children }: { children: ReactNode }): ReactNode => (
      <Activity mode={mode}>{children}</Activity>
    );

    const { result, rerender } = renderHook(() => useLoginSubmitter(t), { wrapper });

    act(() => {
      void result.current.handleLogin(buildCredentials());
    });
    mode = 'hidden';
    rerender();

    expect(signals[0]?.aborted).toBe(true);
    expect(abort).toHaveBeenCalledTimes(1);

    mode = 'visible';
    rerender();
    act(() => {
      void result.current.handleLogin(buildCredentials());
    });
    mode = 'hidden';
    rerender();

    expect(signals).toHaveLength(2);
    expect(signals[1]?.aborted).toBe(true);
    expect(abort).toHaveBeenCalledTimes(2);
    expect(new Set(abort.mock.contexts).size).toBe(2);
  });

  it('keeps a stable handler that still calls through to the sign-in run', async () => {
    const { result, rerender } = renderHook(() => useLoginSubmitter(t));
    const handlerBeforeRerender = result.current.handleLogin;

    rerender();

    expect(result.current.handleLogin).toBe(handlerBeforeRerender);

    mockRun.mockResolvedValue(undefined);
    rerender();

    expect(result.current.handleLogin).toBe(handlerBeforeRerender);

    const credentials = buildCredentials();
    await act(async () => {
      await result.current.handleLogin(credentials);
    });

    expect(mockRun).toHaveBeenCalledWith(credentials, expect.any(AbortSignal));
  });
});
