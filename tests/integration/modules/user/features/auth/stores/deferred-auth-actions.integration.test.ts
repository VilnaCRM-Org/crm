import '../../../../../setup';

import container from '@/config/dependency-injection-config';
import { useAuthStore, authActions } from '@auth/stores';
import { buildCredentials, buildUser } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

import server, { defaultLoginResponse } from '../../../../../mocks/server';

describe('deferred auth actions integration', () => {
  afterEach(() => {
    server.resetHandlers();
    resetClientStores();
  });

  it('surfaces a retryable error when the DI graph fails to load, then recovers', async () => {
    const credentials = buildCredentials();
    const registration = buildUser();
    const chunkLoadFailure = new Error('chunk load failed');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const resolveSpy = jest.spyOn(container, 'resolve').mockImplementation(() => {
      throw chunkLoadFailure;
    });

    await authActions.loginUser(credentials);
    expect(consoleError).toHaveBeenCalledWith(
      'Auth module failed to load; surfacing retryable error to the user.',
      chunkLoadFailure
    );
    expect(useAuthStore.getState()).toMatchObject({
      loginLoading: false,
      loginError: { kind: 'network', retryable: true },
    });

    await authActions.registerUser(registration);
    expect(useAuthStore.getState()).toMatchObject({
      registerLoading: false,
      registerError: { kind: 'network', retryable: true },
    });

    expect(consoleError).toHaveBeenCalledTimes(2);

    resolveSpy.mockRestore();

    await authActions.loginUser(credentials);
    expect(useAuthStore.getState().token).toBe(defaultLoginResponse.token);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});
