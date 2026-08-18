import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';

import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';
import { AuthStateVar, authActions } from '@auth/stores';
import { buildCredentials } from '@tests/builders';

const t = ((key: string): string => key) as unknown as TFunction;

describe('useLoginSubmitter request tracking', () => {
  beforeEach(() => {
    AuthStateVar.reset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stops tracking a settled request so unmounting cannot abort it', async () => {
    const signals: AbortSignal[] = [];
    jest
      .spyOn(authActions, 'loginUser')
      .mockImplementation(async (_data, signal?: AbortSignal): Promise<void> => {
        signals.push(signal as AbortSignal);
      });

    const { result, unmount } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin(buildCredentials());
    });

    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    unmount();

    expect(signals[0].aborted).toBe(false);
  });

  it('aborts a request that is still in flight when the form unmounts', () => {
    const signals: AbortSignal[] = [];
    jest.spyOn(authActions, 'loginUser').mockImplementation(
      (_data, signal?: AbortSignal): Promise<void> =>
        new Promise<void>(() => {
          signals.push(signal as AbortSignal);
        })
    );

    const { result, unmount } = renderHook(() => useLoginSubmitter(t));

    act(() => {
      void result.current.handleLogin(buildCredentials());
    });

    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    unmount();

    expect(signals[0].aborted).toBe(true);
  });

  it('rebinds the submit handler when the login action itself changes', async () => {
    const { result, rerender } = renderHook(() => useLoginSubmitter(t));
    const handlerBeforeRebind = result.current.handleLogin;

    rerender();

    expect(result.current.handleLogin).toBe(handlerBeforeRebind);

    const loginUser = jest.spyOn(authActions, 'loginUser').mockResolvedValue(undefined);
    rerender();

    expect(result.current.handleLogin).not.toBe(handlerBeforeRebind);

    const credentials = buildCredentials();
    await act(async () => {
      await result.current.handleLogin(credentials);
    });

    expect(loginUser).toHaveBeenCalledWith(credentials, expect.any(AbortSignal));
  });
});
