import { act, renderHook } from '@testing-library/react';

import useLoginView from '@auth/components/form-section/auth-forms/use-login-view';
import type { LoginViewInput } from '@auth/types/auth-forms/use-login-view';

const IDLE: LoginViewInput = { error: '', isSubmitting: false, signedIn: false };

const mount = (
  initial: LoginViewInput = IDLE
): ReturnType<typeof renderHook<ReturnType<typeof useLoginView>, LoginViewInput>> =>
  renderHook((input: LoginViewInput) => useLoginView(input), { initialProps: initial });

describe('useLoginView', () => {
  it('starts on the form with no return yet', () => {
    const { result } = mount();

    expect(result.current.view).toBe('form');
    expect(result.current.returnCount).toBe(0);
  });

  it('shows the error once a request settles with one', () => {
    const { result, rerender } = mount({ ...IDLE, isSubmitting: true });

    rerender({ ...IDLE, error: 'failed', isSubmitting: true });
    expect(result.current.view).toBe('form');

    rerender({ ...IDLE, error: 'failed' });
    expect(result.current.view).toBe('error');
  });

  it('keeps the error card through a retry that clears the store error', () => {
    const { result, rerender } = mount({ ...IDLE, error: 'failed' });
    expect(result.current.view).toBe('error');

    rerender({ ...IDLE, isSubmitting: true });

    expect(result.current.view).toBe('error');
  });

  it('switches to success when signed in, even over an error', () => {
    const { result, rerender } = mount({ ...IDLE, error: 'failed' });

    rerender({ ...IDLE, error: 'failed', signedIn: true });

    expect(result.current.view).toBe('success');
  });

  it('returns to the form once a retry settles without an error or a new sign-in', () => {
    const { result, rerender } = mount({ ...IDLE, error: 'failed' });
    rerender({ ...IDLE, error: 'failed', isSubmitting: true });

    rerender(IDLE);

    expect(result.current.view).toBe('form');
    expect(result.current.returnCount).toBe(1);
  });

  it('counts no return when a retry settles signed in', () => {
    const { result, rerender } = mount({ ...IDLE, error: 'failed' });
    rerender({ ...IDLE, error: 'failed', isSubmitting: true });

    rerender({ ...IDLE, signedIn: true });

    expect(result.current.view).toBe('success');
    expect(result.current.returnCount).toBe(0);
  });

  it('returns to the form when the session ends after a sign-in over an error', () => {
    const { result, rerender } = mount({ ...IDLE, error: 'failed' });
    rerender({ ...IDLE, signedIn: true });

    rerender(IDLE);

    expect(result.current.view).toBe('form');
    expect(result.current.returnCount).toBe(1);
  });

  it('returns to the form on back and counts every return', () => {
    const { result, rerender } = mount({ ...IDLE, error: 'failed' });

    act(() => result.current.back());
    rerender(IDLE);
    expect(result.current.view).toBe('form');
    expect(result.current.returnCount).toBe(1);

    rerender({ ...IDLE, error: 'failed again' });
    expect(result.current.view).toBe('error');
    act(() => result.current.back());

    expect(result.current.returnCount).toBe(2);
  });
});
