import { renderHook } from '@testing-library/react';

import useRegistrationViewSync from '@auth/hooks/use-registration-view-sync';

describe('useRegistrationViewSync', () => {
  it('switches to success when a user is present', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({
        user: { email: 'a@b' },
        error: null,
        isSubmitting: false,
        setView,
      })
    );

    expect(setView).toHaveBeenCalledWith('success');
  });

  it('switches to error when an error is present', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({
        user: null,
        error: 'oops',
        isSubmitting: false,
        setView,
      })
    );

    expect(setView).toHaveBeenCalledWith('error');
  });

  it('does not switch view while a submission is in flight', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({
        user: { email: 'a@b' },
        error: 'oops',
        isSubmitting: true,
        setView,
      })
    );

    expect(setView).not.toHaveBeenCalled();
  });

  it('does not switch view when no user and no error are present', () => {
    const setView = jest.fn();
    renderHook(() =>
      useRegistrationViewSync({
        user: null,
        error: null,
        isSubmitting: false,
        setView,
      })
    );

    expect(setView).not.toHaveBeenCalled();
  });
});
