import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import {
  sanitizeAuthState,
  selectEmail,
  selectIsAuthenticated,
  selectLoginError,
  selectLoginLoading,
  selectRegisterError,
  selectRegisterLoading,
  selectRegisterRetryable,
  selectToken,
  useAuthStore,
} from '@/stores/auth-store';
import type LoginAPI from '@auth/repositories/login-api';
import type RegistrationAPI from '@auth/repositories/registration-api';

const mockLoginAPI = {
  login: jest.fn(),
} as unknown as LoginAPI;

const mockRegistrationAPI = {
  register: jest.fn(),
} as unknown as RegistrationAPI;

function createDelayedPromise<T>(ms: number, value?: T): Promise<T | undefined> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

describe('authStore', () => {
  beforeEach(() => {
    container.registerInstance(TOKENS.LoginAPI, mockLoginAPI);
    container.registerInstance(TOKENS.RegistrationAPI, mockRegistrationAPI);
    jest.clearAllMocks();
    useAuthStore.getState().reset();
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();

    expect(state.email).toBe('');
    expect(state.token).toBeNull();
    expect(state.loginLoading).toBe(false);
    expect(state.loginError).toBeNull();
    expect(state.registerLoading).toBe(false);
    expect(state.registerError).toBeNull();
  });

  it('should reset state', () => {
    const { reset } = useAuthStore.getState();

    useAuthStore.setState({
      email: 'test@example.com',
      token: 'test-token',
      loginLoading: true,
      loginError: 'login error',
      registerLoading: true,
      registerError: 'register error',
    });

    reset();

    const state = useAuthStore.getState();
    expect(state.email).toBe('');
    expect(state.token).toBeNull();
    expect(state.loginLoading).toBe(false);
    expect(state.loginError).toBeNull();
    expect(state.registerLoading).toBe(false);
    expect(state.registerError).toBeNull();
  });

  it('should logout and clear state', () => {
    const { logout } = useAuthStore.getState();

    useAuthStore.setState({
      email: 'test@example.com',
      token: 'test-token',
    });

    logout();

    const state = useAuthStore.getState();
    expect(state.email).toBe('');
    expect(state.token).toBeNull();
  });

  describe('loginUser', () => {
    it('should handle successful login', async () => {
      const mockResponse = { token: 'test-token-123' };
      (mockLoginAPI.login as jest.Mock).mockResolvedValue(mockResponse);

      const { loginUser } = useAuthStore.getState();
      const credentials = { email: 'Test@Example.com', password: 'password123' };

      await loginUser(credentials);

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.email).toBe('test@example.com');
      expect(state.token).toBe('test-token-123');
      expect(state.loginError).toBeNull();
    });

    it('should set loading state during login', async () => {
      (mockLoginAPI.login as jest.Mock).mockImplementation(() =>
        createDelayedPromise(50, { token: 'test-token-123' })
      );

      const { loginUser } = useAuthStore.getState();
      const loginPromise = loginUser({ email: 'test@example.com', password: 'password123' });

      expect(useAuthStore.getState().loginLoading).toBe(true);

      await loginPromise;

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.token).toBe('test-token-123');
    });

    it('should handle validation error from API response', async () => {
      (mockLoginAPI.login as jest.Mock).mockResolvedValue({ invalid: 'response' });

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
      expect(state.token).toBeNull();
    });

    it('should handle API error', async () => {
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
      expect(state.token).toBeNull();
    });

    it('should handle abort signal with DOMException', async () => {
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(
        new DOMException('Aborted', 'AbortError')
      );

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle abort error with name === "AbortError"', async () => {
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(abortError);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });
  });

  describe('registerUser', () => {
    it('should handle successful registration', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockResolvedValue({
        fullName: 'Test User',
        email: 'test@example.com',
      });

      const { registerUser } = useAuthStore.getState();
      await registerUser({
        email: 'Test@Example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
      expect(state.user).toEqual({ fullName: 'Test User', email: 'test@example.com' });
    });

    it('should set loading state during registration', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockImplementation(() =>
        createDelayedPromise(50, { fullName: 'Test User', email: 'test@example.com' })
      );

      const { registerUser } = useAuthStore.getState();
      const registerPromise = registerUser({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(useAuthStore.getState().registerLoading).toBe(true);

      await registerPromise;

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should handle API error', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { registerUser } = useAuthStore.getState();
      await registerUser({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
    });

    it('should handle abort signal with DOMException', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(
        new DOMException('Aborted', 'AbortError')
      );

      const { registerUser } = useAuthStore.getState();
      await registerUser({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      useAuthStore.setState({
        email: 'user@test.com',
        token: 'test-token',
        loginLoading: false,
        loginError: 'login error',
        registerLoading: true,
        registerError: 'register error',
      });
    });

    it('selectEmail returns email', () => {
      expect(selectEmail(useAuthStore.getState())).toBe('user@test.com');
    });

    it('selectToken returns token', () => {
      expect(selectToken(useAuthStore.getState())).toBe('test-token');
    });

    it('selectLoginLoading returns login loading state', () => {
      expect(selectLoginLoading(useAuthStore.getState())).toBe(false);
    });

    it('selectLoginError returns login error', () => {
      expect(selectLoginError(useAuthStore.getState())).toBe('login error');
    });

    it('selectRegisterLoading returns register loading state', () => {
      expect(selectRegisterLoading(useAuthStore.getState())).toBe(true);
    });

    it('selectRegisterError returns register error', () => {
      expect(selectRegisterError(useAuthStore.getState())).toBe('register error');
    });

    it('selectIsAuthenticated returns true when token exists', () => {
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
    });

    it('selectIsAuthenticated returns false when token is null', () => {
      useAuthStore.setState({ token: null });
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
    });

    it('selectRegisterRetryable returns the registerRetryable flag', () => {
      useAuthStore.setState({ registerRetryable: true });
      expect(selectRegisterRetryable(useAuthStore.getState())).toBe(true);
    });
  });

  describe('initial state hydration', () => {
    it('seeds token from getPreloadedAuthToken when present', () => {
      jest.isolateModules(() => {
        jest.doMock('@/stores/preloaded-auth-token', () => ({
          getPreloadedAuthToken: (): string => 'preloaded-token',
        }));

        const { useAuthStore: store } = require('@/stores/auth-store');
        expect(store.getState().token).toBe('preloaded-token');

        jest.dontMock('@/stores/preloaded-auth-token');
      });
    });
  });

  describe('resetRegistration', () => {
    it('clears registration fields without affecting other state', () => {
      useAuthStore.setState({
        email: 'user@test.com',
        token: 'tok',
        user: { fullName: 'X', email: 'x@y.com' },
        registerError: 'bad',
        registerLoading: true,
        registerRetryable: false,
      });

      useAuthStore.getState().resetRegistration();

      const state = useAuthStore.getState();
      expect(state.email).toBe('user@test.com');
      expect(state.token).toBe('tok');
      expect(state.user).toBeNull();
      expect(state.registerError).toBeNull();
      expect(state.registerLoading).toBe(false);
      expect(state.registerRetryable).toBeUndefined();
    });
  });

  describe('registerUser validation failure path', () => {
    it('sets registerError when the response fails schema validation', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockResolvedValue({
        fullName: 123,
        email: 456,
      });

      const { registerUser } = useAuthStore.getState();
      await registerUser({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeTruthy();
      expect(state.user).toBeNull();
    });
  });

  describe('sanitizeAuthState', () => {
    it('redacts token when token exists', () => {
      const stateWithToken = { ...useAuthStore.getState(), token: 'real-secret-token' };
      const result = sanitizeAuthState(stateWithToken);
      expect(result.token).toBe('[REDACTED]');
    });

    it('keeps null token as null', () => {
      const stateWithoutToken = { ...useAuthStore.getState(), token: null };
      const result = sanitizeAuthState(stateWithoutToken);
      expect(result.token).toBeNull();
    });
  });
});
