import type AuthStateVarClass from '@auth/stores/auth-var';
import type { AuthActions } from '@auth/types/auth-store';

const resolveMock = jest.fn();

jest.mock('@/config/dependency-injection-config', () => ({
  __esModule: true,
  default: { resolve: (token: unknown): unknown => resolveMock(token) },
}));

type Barrel = { authActions: AuthActions; AuthStateVar: typeof AuthStateVarClass };

const loadBarrel = async (): Promise<Barrel> => {
  let barrel: Barrel | undefined;
  await jest.isolateModulesAsync(async () => {
    barrel = (await import('@auth/stores')) as unknown as Barrel;
  });
  return barrel as Barrel;
};

const makeActions = (): { login: jest.Mock; register: jest.Mock } => ({
  login: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue(undefined),
});

const credentials = { email: 'a@b.c', password: 'p' };
const registration = { fullName: 'A', email: 'a@b.c', password: 'p' };

describe('deferred auth actions composition root', () => {
  it('sets loginLoading synchronously before the deferred graph resolves', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();
    resolveMock.mockReturnValue(makeActions());

    const pending = authActions.loginUser(credentials);
    expect(AuthStateVar.get().loginLoading).toBe(true);
    await pending;
  });

  it('delegates login with credentials and signal, reusing one resolved instance', async () => {
    const { authActions } = await loadBarrel();
    const actions = makeActions();
    resolveMock.mockReturnValue(actions);
    const { signal } = new AbortController();

    await authActions.loginUser(credentials, signal);
    await authActions.loginUser(credentials);

    expect(actions.login).toHaveBeenNthCalledWith(1, credentials, signal);
    expect(actions.login).toHaveBeenNthCalledWith(2, credentials, undefined);
    expect(resolveMock).toHaveBeenCalledTimes(1);
  });

  it('sets registerLoading and clears the user synchronously, then delegates', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();
    const actions = makeActions();
    resolveMock.mockReturnValue(actions);

    const pending = authActions.registerUser(registration);
    expect(AuthStateVar.get()).toMatchObject({ registerLoading: true, user: null });
    await pending;

    expect(actions.register).toHaveBeenCalledWith(registration, undefined);
  });

  it('stores a retryable login error when the deferred graph fails to load', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();
    resolveMock.mockImplementation(() => {
      throw new Error('chunk load failed');
    });

    await authActions.loginUser(credentials);

    expect(AuthStateVar.get()).toMatchObject({
      loginLoading: false,
      loginError: { kind: 'network', retryable: true },
    });
  });

  it('stores a retryable register error when the deferred graph fails to load', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();
    resolveMock.mockImplementation(() => {
      throw new Error('chunk load failed');
    });

    await authActions.registerUser(registration);

    expect(AuthStateVar.get()).toMatchObject({
      registerLoading: false,
      registerError: { kind: 'network', retryable: true },
    });
  });

  it('retries the load after a failure instead of caching the rejection', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();
    const actions = makeActions();
    resolveMock
      .mockImplementationOnce(() => {
        throw new Error('chunk load failed');
      })
      .mockReturnValue(actions);

    await authActions.loginUser(credentials);
    expect(AuthStateVar.get().loginError).not.toBeNull();

    await authActions.loginUser(credentials);
    expect(actions.login).toHaveBeenCalledWith(credentials, undefined);
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });
});
