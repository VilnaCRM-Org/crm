import { renderHook } from '@testing-library/react';

import useRegistrationViewSync from '@auth/hooks/use-registration-view-sync';
import type { Params } from '@auth/types/registration-view-sync';
import { buildUser } from '@tests/builders';

const useHook = (params: Params): void => useRegistrationViewSync(params);

describe('useRegistrationViewSync re-syncs after the first render', () => {
  it('switches to success once a submission that was in flight resolves', () => {
    const setView = jest.fn();
    const initialProps: Params = { user: null, error: null, isSubmitting: true, setView };
    const { rerender } = renderHook(useHook, { initialProps });

    expect(setView).not.toHaveBeenCalled();

    rerender({ user: buildUser(), error: null, isSubmitting: false, setView });

    expect(setView).toHaveBeenCalledWith('success');
  });

  it('switches to error once a submission that was in flight fails', () => {
    const setView = jest.fn();
    const initialProps: Params = { user: null, error: null, isSubmitting: true, setView };
    const { rerender } = renderHook(useHook, { initialProps });

    rerender({ user: null, error: 'registration rejected', isSubmitting: false, setView });

    expect(setView).toHaveBeenCalledWith('error');
  });

  it('re-runs when only the setView callback identity changes', () => {
    const firstSetView = jest.fn();
    const initialProps: Params = {
      user: buildUser(),
      error: null,
      isSubmitting: false,
      setView: firstSetView,
    };
    const { rerender } = renderHook(useHook, { initialProps });

    const secondSetView = jest.fn();
    rerender({ ...initialProps, setView: secondSetView });

    expect(secondSetView).toHaveBeenCalledWith('success');
  });
});
