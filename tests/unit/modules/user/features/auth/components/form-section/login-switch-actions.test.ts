import { act } from 'react';

import LoginSwitchController, {
  LOAD_LOGIN_ERROR_KEY,
} from '@auth/components/form-section/login-switch-actions';
import type { SwitchDeps } from '@auth/types/form-section/login-switch-actions';
import loadLoginForm from '@auth/utils/load-login-form';

const switchToRegister = (deps: SwitchDeps): void =>
  new LoginSwitchController(deps).switchToRegister();
const switchToLogin = (deps: SwitchDeps): void => new LoginSwitchController(deps).switchToLogin();

jest.mock('react', () => {
  const actual = jest.requireActual('react') as typeof import('react');

  return {
    ...actual,
    startTransition: (callback: () => void): void => {
      callback();
    },
  };
});

jest.mock('@auth/utils/load-login-form');

const makeDeps = (overrides?: Partial<SwitchDeps>): SwitchDeps => ({
  isLoadingLogin: false,
  mode: 'register',
  loginSwitchRequest: { current: 0 },
  setMode: jest.fn(),
  setIsLoadingLogin: jest.fn(),
  setLoadLoginError: jest.fn(),
  ...overrides,
});

const makeSameInstanceDeps = (
  shared: Pick<
    SwitchDeps,
    'loginSwitchRequest' | 'setMode' | 'setIsLoadingLogin' | 'setLoadLoginError'
  >,
  overrides?: Partial<SwitchDeps>
): SwitchDeps => ({
  isLoadingLogin: false,
  mode: 'register',
  ...shared,
  ...overrides,
});

describe('switchToRegister', () => {
  beforeEach(() => jest.resetAllMocks());

  it('clears the load error and switches mode to register', () => {
    const deps = makeDeps();
    switchToRegister(deps);
    expect(deps.setLoadLoginError).toHaveBeenCalledWith(null);
    expect(deps.setIsLoadingLogin).toHaveBeenCalledWith(false);
    expect(deps.setMode).toHaveBeenCalledWith('register');
  });
});

describe('switchToLogin', () => {
  beforeEach(() => jest.resetAllMocks());

  it('does nothing when login is already loading', () => {
    const deps = makeDeps({ isLoadingLogin: true });
    switchToLogin(deps);
    expect(deps.setIsLoadingLogin).not.toHaveBeenCalled();
  });

  it('loads login form and switches to login mode on success', async () => {
    const deps = makeDeps();
    (loadLoginForm.load as jest.Mock).mockResolvedValue(undefined);

    switchToLogin(deps);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(deps.setIsLoadingLogin).toHaveBeenCalledWith(true);
    expect(deps.setMode).toHaveBeenCalledWith('login');
    expect(deps.setIsLoadingLogin).toHaveBeenCalledWith(false);
  });

  it('sets load error and stops loading when the form fails to load', async () => {
    const deps = makeDeps();
    (loadLoginForm.load as jest.Mock).mockRejectedValue(new Error('chunk failed'));

    switchToLogin(deps);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(deps.setLoadLoginError).toHaveBeenCalledWith(LOAD_LOGIN_ERROR_KEY);
    expect(deps.setIsLoadingLogin).toHaveBeenCalledWith(false);
  });

  it('discards a superseded switchToLogin success in the same instance', async () => {
    let resolveFirst!: () => void;
    const firstLoad = new Promise<void>((r) => {
      resolveFirst = r;
    });
    (loadLoginForm.load as jest.Mock)
      .mockReturnValueOnce(firstLoad)
      .mockResolvedValueOnce(undefined);

    const shared = {
      loginSwitchRequest: { current: 0 },
      setMode: jest.fn(),
      setIsLoadingLogin: jest.fn(),
      setLoadLoginError: jest.fn(),
    };
    const staleDeps = makeSameInstanceDeps(shared);
    const freshDeps = makeSameInstanceDeps(shared);

    switchToLogin(staleDeps);
    switchToRegister(freshDeps);

    resolveFirst();
    await firstLoad;
    await Promise.resolve();
    await Promise.resolve();

    expect(staleDeps.setMode).not.toHaveBeenCalledWith('login');
    expect((staleDeps.setIsLoadingLogin as jest.Mock).mock.calls).toEqual([[true], [false]]);
  });

  it('discards a superseded switchToLogin failure in the same instance', async () => {
    let rejectFirst!: (e: Error) => void;
    const firstLoad = new Promise<void>((_, r) => {
      rejectFirst = r;
    });
    (loadLoginForm.load as jest.Mock).mockReturnValueOnce(firstLoad);

    const shared = {
      loginSwitchRequest: { current: 0 },
      setMode: jest.fn(),
      setIsLoadingLogin: jest.fn(),
      setLoadLoginError: jest.fn(),
    };
    const staleDeps = makeSameInstanceDeps(shared);
    const freshDeps = makeSameInstanceDeps(shared);

    switchToLogin(staleDeps);
    switchToRegister(freshDeps);

    rejectFirst(new Error('stale error'));
    await firstLoad.catch(() => {});
    await Promise.resolve();
    await Promise.resolve();

    expect(staleDeps.setLoadLoginError).not.toHaveBeenCalledWith(LOAD_LOGIN_ERROR_KEY);
    expect((staleDeps.setIsLoadingLogin as jest.Mock).mock.calls).toEqual([[true], [false]]);
  });

  it('does not let a different instance cancel an in-flight login switch', async () => {
    let resolveFirst!: () => void;
    const firstLoad = new Promise<void>((r) => {
      resolveFirst = r;
    });
    (loadLoginForm.load as jest.Mock).mockReturnValueOnce(firstLoad);

    const firstInstance = makeDeps();
    const secondInstance = makeDeps();

    switchToLogin(firstInstance);
    switchToRegister(secondInstance);

    await act(async () => {
      resolveFirst();
      await firstLoad;
    });

    expect(firstInstance.setMode).toHaveBeenCalledWith('login');
    expect(firstInstance.setIsLoadingLogin).toHaveBeenCalledWith(false);
  });
});
