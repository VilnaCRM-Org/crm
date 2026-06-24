import { createRef } from 'react';

import type { RegisterUserDto } from '@auth/types/credentials';
import RegistrationHandlersFactory from '@auth/utils/registration-handlers-factory';
import { buildUser } from '@tests/builders';

const createDeps = (
  ref: { current: RegisterUserDto | null } = createRef<RegisterUserDto | null>() as {
    current: RegisterUserDto | null;
  }
): {
  deps: ConstructorParameters<typeof RegistrationHandlersFactory>[0];
  setView: jest.Mock;
  setFormKey: jest.Mock;
  ref: { current: RegisterUserDto | null };
} => {
  const setView = jest.fn();
  const setFormKey = jest.fn();
  return {
    deps: { setView, setFormKey, lastSubmittedDataRef: ref },
    setView,
    setFormKey,
    ref,
  };
};

const createActions = (): {
  actions: ConstructorParameters<typeof RegistrationHandlersFactory>[1];
  registerUser: jest.Mock;
  resetRegistration: jest.Mock;
} => {
  const registerUser = jest.fn().mockResolvedValue(undefined);
  const resetRegistration = jest.fn();
  return {
    actions: { registerUser, resetRegistration },
    registerUser,
    resetRegistration,
  };
};

describe('RegistrationHandlersFactory', () => {
  it('handleRegister normalizes fullName, stores it in ref, and calls registerUser', async () => {
    const { deps, ref } = createDeps();
    const { actions, registerUser } = createActions();
    const handlers = new RegistrationHandlersFactory(deps, actions).build();

    await handlers.handleRegister({
      email: 'a@b.com',
      password: 'pw',
      fullName: '  Name Surname  ',
    });

    expect(ref.current).toEqual({ email: 'a@b.com', password: 'pw', fullName: 'Name Surname' });
    expect(registerUser).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pw',
      fullName: 'Name Surname',
    });
  });

  it('handleSuccessShown increments the form key', () => {
    const { deps, setFormKey } = createDeps();
    const { actions } = createActions();
    const handlers = new RegistrationHandlersFactory(deps, actions).build();

    handlers.handleSuccessShown();

    expect(setFormKey).toHaveBeenCalledTimes(1);
    const updater = setFormKey.mock.calls[0][0] as (prev: number) => number;
    expect(updater(5)).toBe(6);
  });

  it('handleBackToForm resets view, calls resetRegistration, and clears the ref', () => {
    const ref = { current: { email: 'a@b.com', password: 'pw', fullName: 'X' } };
    const { deps, setView } = createDeps(ref);
    const { actions, resetRegistration } = createActions();
    const handlers = new RegistrationHandlersFactory(deps, actions).build();

    handlers.handleBackToForm();

    expect(setView).toHaveBeenCalledWith('form');
    expect(resetRegistration).toHaveBeenCalledTimes(1);
    expect(ref.current).toBeNull();
  });

  it('handleRetry no-ops when there is no last submitted data', () => {
    const { deps } = createDeps();
    const { actions, registerUser, resetRegistration } = createActions();
    const handlers = new RegistrationHandlersFactory(deps, actions).build();

    handlers.handleRetry();

    expect(resetRegistration).not.toHaveBeenCalled();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('handleRetry resets and re-submits with the last submitted data', () => {
    const last: RegisterUserDto = buildUser();
    const ref = { current: last };
    const { deps } = createDeps(ref);
    const { actions, registerUser, resetRegistration } = createActions();
    const handlers = new RegistrationHandlersFactory(deps, actions).build();

    handlers.handleRetry();

    expect(resetRegistration).toHaveBeenCalledTimes(1);
    expect(registerUser).toHaveBeenCalledWith(last);
  });
});
