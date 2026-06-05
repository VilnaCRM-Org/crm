import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';

import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';
import { useAuthStore } from '@auth/stores';

const t: TFunction = ((key: string, options?: Record<string, unknown>): string => {
  if (options?.reason !== undefined) return `${key}|${String(options.reason)}`;
  return key;
}) as unknown as TFunction;

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => {};
  const promise = new Promise<void>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

describe('useLoginSubmitter', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('returns empty error when store has none and exposes loading state', () => {
    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('formats a plain string login error from the store', () => {
    useAuthStore.setState({
      loginError: { kind: 'authentication', displayMessage: 'Bad credentials', retryable: false },
    });

    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('sign_in.errors.login|Bad credentials');
  });

  it('translates an i18n-key shaped login error', () => {
    useAuthStore.setState({
      loginError: {
        kind: 'authentication',
        displayMessage: 'auth.errors.unknown',
        retryable: false,
      },
    });

    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('sign_in.errors.login|auth.errors.unknown');
  });

  it('clears the login error on unmount', () => {
    useAuthStore.setState({
      loginError: { kind: 'authentication', displayMessage: 'still here', retryable: false },
    });

    const { unmount } = renderHook(() => useLoginSubmitter(t));
    unmount();

    expect(useAuthStore.getState().loginError).toBeNull();
  });

  it('invokes the store loginUser action when handleLogin is called', async () => {
    const loginUser = jest.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ loginUser });

    const { result } = renderHook(() => useLoginSubmitter(t));

    await act(async () => {
      await result.current.handleLogin({ email: 'a@b.com', password: 'pw' });
    });

    expect(loginUser).toHaveBeenCalledWith(
      { email: 'a@b.com', password: 'pw' },
      expect.any(AbortSignal)
    );
  });

  it('does not restore a late login error after unmount', async () => {
    const deferred = createDeferred();
    const lateError = {
      kind: 'authentication' as const,
      displayMessage: 'late failure',
      retryable: false,
    };
    const loginUser = jest
      .fn()
      .mockImplementation(async (_data, signal?: AbortSignal): Promise<void> => {
        await deferred.promise;

        if (signal?.aborted) {
          return;
        }

        useAuthStore.setState({ loginError: lateError });
      });

    useAuthStore.setState({ loginUser });

    const { result, unmount } = renderHook(() => useLoginSubmitter(t));
    let pendingLogin!: Promise<void>;

    await act(async () => {
      pendingLogin = result.current.handleLogin({ email: 'a@b.com', password: 'pw' });
    });

    unmount();

    await act(async () => {
      deferred.resolve();
      await pendingLogin;
    });

    expect(useAuthStore.getState().loginError).toBeNull();
  });
});
