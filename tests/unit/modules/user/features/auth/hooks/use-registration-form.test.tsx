import { act, renderHook } from '@testing-library/react';

import useRegistrationForm from '@auth/hooks/use-registration-form';
import { AuthStateVar } from '@auth/stores';

describe('useRegistrationForm', () => {
  beforeEach(() => {
    AuthStateVar.reset();
  });

  it('exposes registration state and handlers, starting on the form view', () => {
    const { result } = renderHook(() => useRegistrationForm());

    expect(result.current.view).toBe('form');
    expect(result.current.errorText).toBe('');
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.showSubmitLoader).toBe(false);
    expect(typeof result.current.handleRegister).toBe('function');
    expect(typeof result.current.handleSuccessShown).toBe('function');
    expect(typeof result.current.handleBackToForm).toBe('function');
    expect(typeof result.current.handleRetry).toBe('function');
  });

  it('reports the store error through errorText and notifies view change subscribers', () => {
    const onViewChange = jest.fn();
    AuthStateVar.set({
      registerError: { kind: 'unknown', displayMessage: 'boom', retryable: false },
    });

    const { result } = renderHook(() => useRegistrationForm(onViewChange));

    expect(result.current.errorText).toBe('boom');
    expect(result.current.showSubmitLoader).toBe(true);
    expect(onViewChange).toHaveBeenCalledWith('error');
    expect(result.current.view).toBe('error');
  });

  it('keeps showSubmitLoader on while the request is in flight', () => {
    AuthStateVar.set({ registerLoading: true });

    const { result } = renderHook(() => useRegistrationForm());

    expect(result.current.isSubmitting).toBe(true);
    expect(result.current.showSubmitLoader).toBe(true);
  });

  it('keeps showSubmitLoader on after success until the result is cleared', () => {
    AuthStateVar.set({
      registerLoading: false,
      user: { email: 'user@example.com', fullName: 'User Example' },
    });

    const { result } = renderHook(() => useRegistrationForm());

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.showSubmitLoader).toBe(true);
  });

  it('increments the form key when success is shown', () => {
    const { result } = renderHook(() => useRegistrationForm());
    const before = result.current.formKey;

    act(() => result.current.handleSuccessShown());

    expect(result.current.formKey).toBe(before + 1);
  });
});
