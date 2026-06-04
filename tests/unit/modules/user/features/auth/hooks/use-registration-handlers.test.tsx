import { act, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';

import useRegistrationHandlers from '@auth/hooks/use-registration-handlers';
import type { RegisterUserDto } from '@auth/types/credentials';

const registerUser = jest.fn<Promise<void>, [RegisterUserDto]>(() => Promise.resolve());
const resetRegistration = jest.fn();
const storeState = { registerUser, resetRegistration };

jest.mock('@/stores/auth-store', () => ({
  __esModule: true,
  useAuthStore: (selector: (state: typeof storeState) => unknown): unknown => selector(storeState),
}));

type Handlers = ReturnType<typeof useRegistrationHandlers>;

describe('useRegistrationHandlers', () => {
  beforeEach(() => {
    registerUser.mockClear();
    resetRegistration.mockClear();
  });

  const buildHook = (): {
    current: () => Handlers;
    setView: jest.Mock;
    setFormKey: jest.Mock;
    lastSubmittedDataRef: MutableRefObject<RegisterUserDto | null>;
  } => {
    const setView = jest.fn();
    const setFormKey = jest.fn();
    const lastSubmittedDataRef = { current: null } as MutableRefObject<RegisterUserDto | null>;

    const { result } = renderHook(() =>
      useRegistrationHandlers({ setView, setFormKey, lastSubmittedDataRef })
    );

    return { current: () => result.current, setView, setFormKey, lastSubmittedDataRef };
  };

  it('handleRegister normalizes fullName, stores it in ref, and registers', async () => {
    const { current, lastSubmittedDataRef } = buildHook();
    const data: RegisterUserDto = { email: 'a@b.com', password: 'pw', fullName: '   Alice Bob   ' };

    await act(() => current().handleRegister(data));

    expect(lastSubmittedDataRef.current).toEqual({ ...data, fullName: 'Alice Bob' });
    expect(registerUser).toHaveBeenCalledWith({ ...data, fullName: 'Alice Bob' });
  });

  it('handleBackToForm resets registration and clears the ref', () => {
    const { current, setView, lastSubmittedDataRef } = buildHook();
    lastSubmittedDataRef.current = { email: 'x', password: 'y', fullName: 'Z' };

    act(() => current().handleBackToForm());

    expect(setView).toHaveBeenCalledWith('form');
    expect(resetRegistration).toHaveBeenCalledTimes(1);
    expect(lastSubmittedDataRef.current).toBeNull();
  });

  it('handleSuccessShown increments the form key', () => {
    const { current, setFormKey } = buildHook();

    act(() => current().handleSuccessShown());

    expect(setFormKey).toHaveBeenCalledWith(expect.any(Function));
    const update = setFormKey.mock.calls[0][0] as (n: number) => number;
    expect(update(3)).toBe(4);
  });

  it('handleRetry resets and re-registers the last submitted data when available', () => {
    const { current, lastSubmittedDataRef } = buildHook();
    const last: RegisterUserDto = { email: 'a@b.com', password: 'pw', fullName: 'Alice' };
    lastSubmittedDataRef.current = last;

    act(() => current().handleRetry());

    expect(resetRegistration).toHaveBeenCalledTimes(1);
    expect(registerUser).toHaveBeenCalledWith(last);
  });

  it('handleRetry is a no-op when no last data is stored', () => {
    const { current } = buildHook();

    act(() => current().handleRetry());

    expect(resetRegistration).not.toHaveBeenCalled();
    expect(registerUser).not.toHaveBeenCalled();
  });
});
