import {
  switchToLogin,
  switchToRegister,
  LOAD_LOGIN_ERROR_KEY,
  type SwitchDeps,
} from '@/modules/User/features/Auth/components/form-section/login-switch-actions';

jest.mock('@/modules/User/features/Auth/utils/load-login-form');

import loadLoginForm from '@/modules/User/features/Auth/utils/load-login-form';

const makeDeps = (overrides?: Partial<SwitchDeps>): SwitchDeps => ({
  isLoadingLogin: false,
  mode: 'register',
  setMode: jest.fn(),
  setIsLoadingLogin: jest.fn(),
  setLoadLoginError: jest.fn(),
  ...overrides,
});

describe('switchToRegister', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears the load error and switches mode to register', () => {
    const deps = makeDeps();
    switchToRegister(deps);
    expect(deps.setLoadLoginError).toHaveBeenCalledWith(null);
    expect(deps.setMode).toHaveBeenCalledWith('register');
  });
});

describe('switchToLogin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing when login is already loading', () => {
    const deps = makeDeps({ isLoadingLogin: true });
    switchToLogin(deps);
    expect(deps.setIsLoadingLogin).not.toHaveBeenCalled();
  });

  it('loads login form and switches to login mode on success', async () => {
    const deps = makeDeps();
    (loadLoginForm as jest.Mock).mockResolvedValue(undefined);

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
    (loadLoginForm as jest.Mock).mockRejectedValue(new Error('chunk failed'));

    switchToLogin(deps);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(deps.setLoadLoginError).toHaveBeenCalledWith(LOAD_LOGIN_ERROR_KEY);
    expect(deps.setIsLoadingLogin).toHaveBeenCalledWith(false);
  });

  it('discards the success result from a superseded switchToLogin call', async () => {
    let resolveFirst!: () => void;
    const firstLoad = new Promise<void>((r) => {
      resolveFirst = r;
    });
    (loadLoginForm as jest.Mock).mockReturnValueOnce(firstLoad).mockResolvedValueOnce(undefined);

    const staleDeps = makeDeps();
    const freshDeps = makeDeps();

    switchToLogin(staleDeps);
    switchToRegister(freshDeps);

    resolveFirst();
    await firstLoad;
    await Promise.resolve();
    await Promise.resolve();

    expect(staleDeps.setMode).not.toHaveBeenCalledWith('login');
    expect(staleDeps.setIsLoadingLogin).not.toHaveBeenCalledWith(false);
  });

  it('discards the failure result from a superseded switchToLogin call', async () => {
    let rejectFirst!: (e: Error) => void;
    const firstLoad = new Promise<void>((_, r) => {
      rejectFirst = r;
    });
    (loadLoginForm as jest.Mock).mockReturnValueOnce(firstLoad);

    const staleDeps = makeDeps();
    const freshDeps = makeDeps();

    switchToLogin(staleDeps);
    switchToRegister(freshDeps);

    rejectFirst(new Error('stale error'));
    await firstLoad.catch(() => {});
    await Promise.resolve();
    await Promise.resolve();

    expect(staleDeps.setLoadLoginError).not.toHaveBeenCalledWith(LOAD_LOGIN_ERROR_KEY);
    expect(staleDeps.setIsLoadingLogin).not.toHaveBeenCalledWith(false);
  });
});
