import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { ObservabilityService } from '@/services/types/observability/observability';
import type { AuthSessionEndHandler as Handler } from '@auth/stores/auth-session-end-handler';
import type { AuthStateWriter } from '@auth/types/auth-store';
import { buildEmail, buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

type HandlerModule = typeof import('@auth/stores/auth-session-end-handler');

const loadHandlerModule = (): Promise<HandlerModule> =>
  loadIsolated(() => import('@auth/stores/auth-session-end-handler'));

const CLEARED = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

describe('AuthSessionEndHandler', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('clears the identity, forgets the demo session, then writes the cleared state', async () => {
    const { AuthSessionEndHandler } = await loadHandlerModule();
    const setState = jest.fn();
    const clearUser = jest.fn();
    const signOut = jest.fn();
    const handler: Handler = new AuthSessionEndHandler(
      { setState } as AuthStateWriter,
      { clearUser } as unknown as ObservabilityService,
      { signOut } as unknown as SandboxDemoSessionProvider
    );

    handler.endSession();

    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState.mock.calls[0]?.[0]).toStrictEqual(CLEARED);
    expect(clearUser.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0] as number
    );
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(
      setState.mock.invocationCallOrder[0] as number
    );
  });

  it('wires the singleton to the auth store, observability core and demo session', async () => {
    const { handlerModule, useAuthStore, observabilityCore } = await loadIsolated(async () => ({
      handlerModule: await import('@auth/stores/auth-session-end-handler'),
      useAuthStore: (await import('@auth/stores/use-auth-store')).default,
      observabilityCore: (await import('@/services/observability/observability-core')).default,
    }));
    const clearUser = jest.spyOn(observabilityCore, 'clearUser').mockImplementation(() => {});
    localStorage.setItem('vilnacrm.sandbox-demo-session', 'demo@vilnacrm.com');
    useAuthStore.setState({ email: buildEmail(), token: buildToken() });

    handlerModule.default.endSession();

    expect(handlerModule.default).toBeInstanceOf(handlerModule.AuthSessionEndHandler);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('vilnacrm.sandbox-demo-session')).toBeNull();
    expect(useAuthStore.getState()).toStrictEqual(CLEARED);
  });
});
