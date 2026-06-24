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
    const resolveSpy = jest.spyOn(container, 'resolve').mockImplementation(() => {
      throw new Error('chunk load failed');
    });

    await authActions.loginUser(credentials);
    expect(AuthStateVar.get()).toMatchObject({
      loginLoading: false,
      loginError: { kind: 'network', retryable: true },
    });

    await authActions.registerUser(registration);
    expect(AuthStateVar.get()).toMatchObject({
      registerLoading: false,
      registerError: { kind: 'network', retryable: true },
    });

    resolveSpy.mockRestore();

    await authActions.loginUser(credentials);
    expect(AuthStateVar.get().token).toBe(defaultLoginResponse.token);
  });
});
