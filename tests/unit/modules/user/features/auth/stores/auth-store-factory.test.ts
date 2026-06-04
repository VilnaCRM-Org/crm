import type AuthStoreActions from '@auth/stores/auth-store-actions';
import AuthStoreFactory from '@auth/stores/auth-store-factory';

const makeActions = (): AuthStoreActions =>
  ({ login: jest.fn(), register: jest.fn() }) as unknown as AuthStoreActions;

describe('AuthStoreFactory', () => {
  it('seeds token from PreloadedAuthToken when available', async () => {
    const originalEnv = process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
    process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = 'preloaded-token';
    try {
      await jest.isolateModulesAsync(async () => {
        const { default: Factory } = await import('@auth/stores/auth-store-factory');
        const useStore = Factory.create(makeActions());
        expect(useStore.getState().token).toBe('preloaded-token');
      });
    } finally {
      if (originalEnv === undefined) {
        delete process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN;
      } else {
        process.env.REACT_APP_LHCI_PRELOADED_AUTH_TOKEN = originalEnv;
      }
    }
  });

  it('delegates loginUser to actions.login with the store set fn', async () => {
    const actions = makeActions();
    const useStore = AuthStoreFactory.create(actions);
    await useStore.getState().loginUser({ email: 'a@b.c', password: 'p' });
    expect(actions.login).toHaveBeenCalledWith(
      expect.any(Function),
      { email: 'a@b.c', password: 'p' },
      undefined
    );
  });

  it('delegates registerUser to actions.register', async () => {
    const actions = makeActions();
    const useStore = AuthStoreFactory.create(actions);
    await useStore.getState().registerUser({ fullName: 'A', email: 'a@b.c', password: 'p' });
    expect(actions.register).toHaveBeenCalled();
  });

  it('logout and reset return to initial state', () => {
    const useStore = AuthStoreFactory.create(makeActions());
    useStore.setState({ email: 'x@y.z', token: 't' });
    useStore.getState().logout();
    expect(useStore.getState().token).toBeNull();
    useStore.setState({ email: 'x', token: 't2' });
    useStore.getState().reset();
    expect(useStore.getState().email).toBe('');
  });

  it('resetRegistration clears registration fields', () => {
    const useStore = AuthStoreFactory.create(makeActions());
    useStore.setState({
      user: { email: 'a@b.c' },
      registerError: { kind: 'unknown', displayMessage: 'e', retryable: false },
      registerLoading: true,
    });
    useStore.getState().resetRegistration();
    const state = useStore.getState();
    expect(state.user).toBeNull();
    expect(state.registerError).toBeNull();
    expect(state.registerLoading).toBe(false);
  });

  it('sanitize redacts the token for devtools', () => {
    expect(AuthStoreFactory.sanitize({ token: 't' } as never).token).toBe('[REDACTED]');
    expect(AuthStoreFactory.sanitize({ token: null } as never).token).toBeNull();
  });
});
