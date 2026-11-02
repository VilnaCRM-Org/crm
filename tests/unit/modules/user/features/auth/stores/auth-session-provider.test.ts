import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import observabilityCore from '@/services/observability/observability-core';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildEmail, buildToken } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

describe('authSessionProvider', () => {
  afterEach(() => {
    resetClientStores();
    jest.restoreAllMocks();
  });

  it('reads the token the auth store holds now', () => {
    const token = buildToken();
    useAuthStore.setState({ token });

    expect(authSessionProvider.token()).toBe(token);

    useAuthStore.setState({ token: null });

    expect(authSessionProvider.token()).toBeNull();
  });

  it('ends the session the rejected token still belongs to', () => {
    const token = buildToken();
    useAuthStore.setState({ token, email: buildEmail() });
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');
    const signOut = jest.spyOn(sandboxDemoSessionProvider, 'signOut');

    authSessionProvider.end(token);

    expect(useAuthStore.getState()).toEqual(CLEARED_AUTH_STATE);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(clearUser.mock.contexts[0]).toBe(observabilityCore);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut.mock.contexts[0]).toBe(sandboxDemoSessionProvider);
  });

  it('keeps a newer session when an older token is rejected', () => {
    const current = buildToken();
    const email = buildEmail();
    useAuthStore.setState({ token: current, email });
    const clearUser = jest.spyOn(observabilityCore, 'clearUser');
    const signOut = jest.spyOn(sandboxDemoSessionProvider, 'signOut');

    authSessionProvider.end(buildToken());

    expect(useAuthStore.getState()).toMatchObject({ token: current, email });
    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
