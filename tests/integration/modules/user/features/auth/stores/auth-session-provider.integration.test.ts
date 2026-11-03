import '../../../../../setup';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthStore, { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import { buildToken } from '@tests/builders';

describe('authSessionProvider over the auth store (integration)', () => {
  afterEach(() => {
    useAuthStore.setState(CLEARED_AUTH_STATE);
  });

  it('ends the session only for the token the store still holds', () => {
    const token = buildToken();
    useAuthStore.setState({ token });

    authSessionProvider.end(buildToken());
    expect(authSessionProvider.token()).toBe(token);

    authSessionProvider.end(token);
    expect(authSessionProvider.token()).toBeNull();
  });
});
