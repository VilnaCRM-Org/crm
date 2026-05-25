import { act, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';

import useRegistrationHandlers from '@auth/hooks/use-registration-handlers';
import type { RegisterUserDto } from '@auth/types/credentials';

const registerUserAction = { type: 'registration/registerUser/pending' };
const resetAction = { type: 'registration/reset' };

jest.mock('@/modules/user/store', () => ({
  registerUser: jest.fn(() => registerUserAction),
  reset: jest.fn(() => resetAction),
}));

describe('useRegistrationHandlers', () => {
  const buildHook = (): {
    view: ReturnType<typeof renderHook>;
    dispatch: jest.Mock;
    setView: jest.Mock;
    setFormKey: jest.Mock;
    lastSubmittedDataRef: MutableRefObject<RegisterUserDto | null>;
  } => {
    const dispatch = jest.fn();
    const setView = jest.fn();
    const setFormKey = jest.fn();
    const lastSubmittedDataRef = { current: null } as MutableRefObject<RegisterUserDto | null>;

    const view = renderHook(() =>
      useRegistrationHandlers({
        dispatch: dispatch as never,
        setView,
        setFormKey,
        lastSubmittedDataRef,
      })
    );

    return { view, dispatch, setView, setFormKey, lastSubmittedDataRef };
  };

  it('handleRegister normalizes fullName, stores it in ref, and dispatches', () => {
    const { view: result, dispatch, lastSubmittedDataRef } = buildHook();
    const data: RegisterUserDto = {
      email: 'a@b.com',
      password: 'pw',
      fullName: '   Alice Bob   ',
    };

    act(() =>
      (result.result.current as ReturnType<typeof useRegistrationHandlers>).handleRegister(data)
    );

    expect(lastSubmittedDataRef.current).toEqual({ ...data, fullName: 'Alice Bob' });
    expect(dispatch).toHaveBeenCalledWith(registerUserAction);
  });

  it('handleBackToForm resets state and clears the ref', () => {
    const { view: result, dispatch, setView, lastSubmittedDataRef } = buildHook();
    lastSubmittedDataRef.current = { email: 'x', password: 'y', fullName: 'Z' };

    act(() =>
      (result.result.current as ReturnType<typeof useRegistrationHandlers>).handleBackToForm()
    );

    expect(setView).toHaveBeenCalledWith('form');
    expect(dispatch).toHaveBeenCalledWith(resetAction);
    expect(lastSubmittedDataRef.current).toBeNull();
  });

  it('handleSuccessShown increments the form key', () => {
    const { view: result, setFormKey } = buildHook();

    act(() =>
      (result.result.current as ReturnType<typeof useRegistrationHandlers>).handleSuccessShown()
    );

    expect(setFormKey).toHaveBeenCalledWith(expect.any(Function));
    const update = setFormKey.mock.calls[0][0] as (n: number) => number;
    expect(update(3)).toBe(4);
  });

  it('handleRetry resets and re-dispatches the last submitted data when available', () => {
    const { view: result, dispatch, lastSubmittedDataRef } = buildHook();
    const last: RegisterUserDto = { email: 'a@b.com', password: 'pw', fullName: 'Alice' };
    lastSubmittedDataRef.current = last;

    act(() => (result.result.current as ReturnType<typeof useRegistrationHandlers>).handleRetry());

    expect(dispatch).toHaveBeenNthCalledWith(1, resetAction);
    expect(dispatch).toHaveBeenNthCalledWith(2, registerUserAction);
  });

  it('handleRetry is a no-op when no last data is stored', () => {
    const { view: result, dispatch } = buildHook();

    act(() => (result.result.current as ReturnType<typeof useRegistrationHandlers>).handleRetry());

    expect(dispatch).not.toHaveBeenCalled();
  });
});
