import { act, renderHook } from '@testing-library/react';

import { useAuthStore } from '@/stores/auth-store';
import useRegistrationForm from '@auth/hooks/use-registration-form';

describe('useRegistrationForm', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('exposes registration state and handlers, starting on the form view', () => {
    const { result } = renderHook(() => useRegistrationForm());

    expect(result.current.view).toBe('form');
    expect(result.current.errorText).toBe('');
    expect(result.current.isSubmitting).toBe(false);
    expect(typeof result.current.handleRegister).toBe('function');
    expect(typeof result.current.handleSuccessShown).toBe('function');
    expect(typeof result.current.handleBackToForm).toBe('function');
    expect(typeof result.current.handleRetry).toBe('function');
  });

  it('reports the store error through errorText and notifies view change subscribers', () => {
    const onViewChange = jest.fn();
    useAuthStore.setState({ registerError: 'boom' });

    const { result } = renderHook(() => useRegistrationForm(onViewChange));

    expect(result.current.errorText).toBe('boom');
    expect(onViewChange).toHaveBeenCalledWith('error');
    expect(result.current.view).toBe('error');
  });

  it('increments the form key when success is shown', () => {
    const { result } = renderHook(() => useRegistrationForm());
    const before = result.current.formKey;

    act(() => result.current.handleSuccessShown());

    expect(result.current.formKey).toBe(before + 1);
  });
});
