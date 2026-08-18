import type { ObservabilityCore } from '@/services/observability/observability-core';
import type AuthStateVarSingleton from '@auth/stores/auth-var';
import type { AuthActions } from '@auth/types/auth-store';
import { buildCredentials, buildUser } from '@tests/builders';

const resolveMock = jest.fn();

jest.mock('@/config/dependency-injection-config', () => ({
  __esModule: true,
  default: { resolve: (token: unknown): unknown => resolveMock(token) },
}));

const LOAD_FAILURE = {
  kind: 'network',
  displayMessage: 'Failed to load the authentication service. Please try again.',
  retryable: true,
};
const CONSOLE_MESSAGE = 'Auth module failed to load; surfacing retryable error to the user.';
const CAPTURE_CONTEXT = { source: 'auth:module-load' };

const credentials = buildCredentials();
const registration = buildUser();

interface Loaded {
  authActions: AuthActions;
  AuthStateVar: typeof AuthStateVarSingleton;
  observability: ObservabilityCore;
}

const loadBarrel = async (): Promise<Loaded> => {
  let loaded: Loaded | undefined;
  await jest.isolateModulesAsync(async () => {
    const observability = (await import('@/services/observability/observability-core')).default;
    const barrel = (await import('@auth/stores')) as unknown as Omit<Loaded, 'observability'>;
    loaded = { ...barrel, observability };
  });
  return loaded as Loaded;
};

describe('deferred auth actions load-failure diagnostics', () => {
  let consoleSpy: jest.SpyInstance;
  const failure = new Error('chunk load failed');

  beforeEach(() => {
    resolveMock.mockReset();
    resolveMock.mockImplementation(() => {
      throw failure;
    });
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('surfaces the retryable load-failure error verbatim on login', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();

    await authActions.loginUser(credentials);

    expect(AuthStateVar.get().loginError).toEqual(LOAD_FAILURE);
    expect(AuthStateVar.get().loginLoading).toBe(false);
  });

  it('surfaces the retryable load-failure error verbatim on registration', async () => {
    const { authActions, AuthStateVar } = await loadBarrel();

    await authActions.registerUser(registration);

    expect(AuthStateVar.get().registerError).toEqual(LOAD_FAILURE);
    expect(AuthStateVar.get().registerLoading).toBe(false);
  });

  it('logs the load failure with its diagnostic message and the raw cause', async () => {
    const { authActions } = await loadBarrel();

    await authActions.loginUser(credentials);

    expect(consoleSpy).toHaveBeenCalledWith(CONSOLE_MESSAGE, failure);
  });

  it('reports the load failure to observability with the auth module-load source', async () => {
    const { authActions, observability } = await loadBarrel();
    const captureSpy = jest
      .spyOn(observability, 'captureError')
      .mockImplementation(() => undefined);

    await authActions.loginUser(credentials);

    expect(captureSpy).toHaveBeenCalledWith(failure, CAPTURE_CONTEXT);
  });

  it('leaves the state untouched by diagnostics when the graph loads', async () => {
    const { authActions, AuthStateVar, observability } = await loadBarrel();
    const captureSpy = jest
      .spyOn(observability, 'captureError')
      .mockImplementation(() => undefined);
    resolveMock.mockReturnValue({
      login: jest.fn().mockResolvedValue(undefined),
      register: jest.fn().mockResolvedValue(undefined),
    });

    await authActions.loginUser(credentials);

    expect(AuthStateVar.get().loginError).toBeNull();
    expect(captureSpy).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
