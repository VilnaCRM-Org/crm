import '../../../../../setup';

import container from '@/config/dependency-injection-config';
import { useAuthStore, authActions } from '@auth/stores';
import { buildUser } from '@tests/builders';
import { resetClientStores } from '@tests/utils/reset-client-stores';

import server from '../../../../../mocks/server';

describe('deferred auth actions integration', () => {
  afterEach(() => {
    server.resetHandlers();
    resetClientStores();
  });

  it('surfaces a retryable error when the DI graph fails to load, then recovers', async () => {
    const registration = buildUser();
    const chunkLoadFailure = new Error('chunk load failed');
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const resolveSpy = jest.spyOn(container, 'resolve').mockImplementation(() => {
      throw chunkLoadFailure;
    });

    await authActions.registerUser(registration);
    expect(consoleError).toHaveBeenCalledWith(
      'Auth module failed to load; surfacing retryable error to the user.',
      chunkLoadFailure
    );
    expect(useAuthStore.getState()).toMatchObject({
      registerLoading: false,
      registerError: { kind: 'network', retryable: true },
    });

    expect(consoleError).toHaveBeenCalledTimes(1);

    resolveSpy.mockRestore();

    await authActions.registerUser(registration);
    expect(useAuthStore.getState().registerError).toBeNull();
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
