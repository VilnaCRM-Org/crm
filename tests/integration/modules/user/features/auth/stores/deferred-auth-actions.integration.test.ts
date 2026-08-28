import '../../../../../setup';

import container from '@/config/dependency-injection-config';
import { AuthStateVar, authActions } from '@auth/stores';
import { buildCredentials, buildUser } from '@tests/builders';

import server, { defaultLoginResponse } from '../../../../../mocks/server';

describe('deferred auth actions integration', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => {
    server.resetHandlers();
    AuthStateVar.reset();
  });
  afterAll(() => server.close());

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
    expect(AuthStateVar.get()).toMatchObject({
      loginLoading: false,
      loginError: { kind: 'network', retryable: true },
    });

    await authActions.registerUser(registration);
    expect(AuthStateVar.get()).toMatchObject({
      registerLoading: false,
      registerError: { kind: 'network', retryable: true },
    });

    expect(consoleError).toHaveBeenCalledTimes(2);

    resolveSpy.mockRestore();

    await authActions.loginUser(credentials);
    expect(AuthStateVar.get().token).toBe(defaultLoginResponse.token);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});
