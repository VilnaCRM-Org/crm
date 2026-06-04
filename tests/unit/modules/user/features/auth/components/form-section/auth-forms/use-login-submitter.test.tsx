import { act, renderHook } from '@testing-library/react';
import type { TFunction } from 'i18next';

import { useAuthStore } from '@/stores/auth-store';
import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';

const t: TFunction = ((key: string, options?: Record<string, unknown>): string => {
  if (options?.reason !== undefined) return `${key}|${String(options.reason)}`;
  return key;
}) as unknown as TFunction;

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
    useAuthStore.setState({ loginError: 'Bad credentials' });

    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('sign_in.errors.login|Bad credentials');
  });

  it('translates an i18n-key shaped login error', () => {
    useAuthStore.setState({ loginError: 'auth.errors.unknown' });

    const { result } = renderHook(() => useLoginSubmitter(t));

    expect(result.current.error).toBe('sign_in.errors.login|auth.errors.unknown');
  });

  it('clears the login error on unmount', () => {
    useAuthStore.setState({ loginError: 'still here' });

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

    expect(loginUser).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
  });
});
