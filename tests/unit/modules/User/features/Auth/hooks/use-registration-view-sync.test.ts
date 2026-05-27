import { renderHook } from '@testing-library/react';

import useRegistrationViewSync from '@auth/hooks/use-registration-view-sync';

describe('useRegistrationViewSync', () => {
  it('does nothing while submitting', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({ user: { email: 'a' }, error: null, isSubmitting: true, setView })
    );
    expect(setView).not.toHaveBeenCalled();
  });

  it('switches to success when a user is present and not submitting', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({ user: { email: 'a' }, error: null, isSubmitting: false, setView })
    );
    expect(setView).toHaveBeenCalledWith('success');
  });

  it('switches to error when an error is present and no user', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({ user: null, error: 'oops', isSubmitting: false, setView })
    );
    expect(setView).toHaveBeenCalledWith('error');
  });

  it('does not switch when there is nothing to show', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({ user: null, error: null, isSubmitting: false, setView })
    );
    expect(setView).not.toHaveBeenCalled();
  });
});
