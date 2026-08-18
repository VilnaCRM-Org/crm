import { act, renderHook } from '@testing-library/react';
import type { MutableRefObject } from 'react';

import useRegistrationHandlers from '@auth/hooks/use-registration-handlers';
import type { RegisterUserDto } from '@auth/types/credentials';
import { buildUser } from '@tests/builders';

const registerUser = jest.fn<Promise<void>, [RegisterUserDto]>(() => Promise.resolve());
const resetRegistration = jest.fn();

jest.mock('@auth/stores', () => ({
  __esModule: true,
  authActions: {
    registerUser: (data: RegisterUserDto): Promise<void> => registerUser(data),
    resetRegistration: (): void => {
      resetRegistration();
    },
  },
}));

type Deps = {
  setView: jest.Mock;
  setFormKey: jest.Mock;
  lastSubmittedDataRef: MutableRefObject<RegisterUserDto | null>;
};

const makeDeps = (): Deps => ({
  setView: jest.fn(),
  setFormKey: jest.fn(),
  lastSubmittedDataRef: { current: null } as MutableRefObject<RegisterUserDto | null>,
});

const useHook = (deps: Deps): ReturnType<typeof useRegistrationHandlers> =>
  useRegistrationHandlers(deps);

describe('useRegistrationHandlers rebuilds when its dependencies change', () => {
  it('routes handleBackToForm to the setView supplied on the latest render', () => {
    const first = makeDeps();
    const { result, rerender } = renderHook(useHook, { initialProps: first });
    const staleHandlers = result.current;

    const second: Deps = { ...first, setView: jest.fn() };
    rerender(second);

    expect(result.current).not.toBe(staleHandlers);

    act(() => result.current.handleBackToForm());

    expect(second.setView).toHaveBeenCalledWith('form');
    expect(first.setView).not.toHaveBeenCalled();
  });

  it('routes handleSuccessShown to the setFormKey supplied on the latest render', () => {
    const first = makeDeps();
    const { result, rerender } = renderHook(useHook, { initialProps: first });

    const second: Deps = { ...first, setFormKey: jest.fn() };
    rerender(second);

    act(() => result.current.handleSuccessShown());

    expect(second.setFormKey).toHaveBeenCalledWith(expect.any(Function));
    expect(first.setFormKey).not.toHaveBeenCalled();
  });

  it('reads handleRetry data from the ref supplied on the latest render', () => {
    const first = makeDeps();
    first.lastSubmittedDataRef.current = buildUser();
    const { result, rerender } = renderHook(useHook, { initialProps: first });

    const latest = buildUser();
    const second: Deps = {
      ...first,
      lastSubmittedDataRef: { current: latest } as MutableRefObject<RegisterUserDto | null>,
    };
    rerender(second);

    act(() => result.current.handleRetry());

    expect(registerUser).toHaveBeenCalledTimes(1);
    expect(registerUser).toHaveBeenCalledWith(latest);
  });
});
