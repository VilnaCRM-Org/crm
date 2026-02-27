import 'reflect-metadata';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import {
  selectEmail,
  selectIsAuthenticated,
  selectLoginError,
  selectLoginLoading,
  selectRegisterError,
  selectRegisterLoading,
  selectToken,
  useAuthStore,
} from '@/modules/User/features/Auth/stores/authStore';

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
    container.clearInstances();
    container.registerInstance(TOKENS.LoginAPI, mockLoginAPI);
    container.registerInstance(TOKENS.RegistrationAPI, mockRegistrationAPI);
    jest.clearAllMocks();
  });

  afterEach(() => {
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
        createDelayedPromise(100, { token: 'test-token-123' })
      );

      const { loginUser } = useAuthStore.getState();
      const loginPromise = loginUser({ email: 'test@example.com', password: 'password123' });

      // Check loading state immediately
      expect(useAuthStore.getState().loginLoading).toBe(true);

      await loginPromise;

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.token).toBe('test-token-123');
    });

    it('should handle validation error from API response', async () => {
      const mockResponse = { invalid: 'response' };
      (mockLoginAPI.login as jest.Mock).mockResolvedValue(mockResponse);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
      expect(state.loginError).toContain('Invalid input');
      expect(state.token).toBeNull();
    });

    it('should handle API error', async () => {
      const mockError = new Error('Network error');
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(mockError);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
      expect(state.token).toBeNull();
    });

    it('should handle abort signal with DOMException', async () => {
      const abortController = new AbortController();
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(
        new DOMException('Aborted', 'AbortError')
      );

      const { loginUser } = useAuthStore.getState();
      const loginPromise = loginUser(
        { email: 'test@example.com', password: 'password123' },
        abortController.signal
      );

      abortController.abort();
      await loginPromise;

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

    it('should handle error with "abort" in message', async () => {
      const error = new Error('Request was aborted by user');
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(error);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeNull();
    });

    it('should handle error without name property', async () => {
      const error = { message: 'Some error' };
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(error);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle error without message property', async () => {
      const error = new Error();
      error.message = undefined as unknown as string;
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(error);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle null error', async () => {
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(null);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });

    it('should handle undefined error', async () => {
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(undefined);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loginLoading).toBe(false);
      expect(state.loginError).toBeTruthy();
    });
  });

  describe('registerUser', () => {
    it('should handle successful registration', async () => {
      const mockResponse = {};
      (mockRegistrationAPI.register as jest.Mock).mockResolvedValue(mockResponse);

      const { registerUser } = useAuthStore.getState();
      const credentials = {
        email: 'Test@Example.com',
        password: 'password123',
        fullName: 'Test User',
      };

      await registerUser(credentials);

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should set loading state during registration', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockImplementation(() =>
        createDelayedPromise(100, {
          fullName: 'Test User',
          email: 'test@example.com',
        })
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

    it('should handle validation error from API response', async () => {
      const mockResponse = { fullName: 123, email: 456 };
      (mockRegistrationAPI.register as jest.Mock).mockResolvedValue(mockResponse);

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

    it('should handle API error', async () => {
      const mockError = new Error('Network error');
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(mockError);

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
      const abortController = new AbortController();
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(
        new DOMException('Aborted', 'AbortError')
      );

      const { registerUser } = useAuthStore.getState();
      const registerPromise = registerUser(
        { email: 'test@example.com', password: 'password123', fullName: 'Test User' },
        abortController.signal
      );

      abortController.abort();
      await registerPromise;

      const state = useAuthStore.getState();
      expect(state.registerLoading).toBe(false);
      expect(state.registerError).toBeNull();
    });

    it('should handle abort error with name === "AbortError"', async () => {
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(abortError);

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

    it('should handle error with "abort" in message', async () => {
      const error = new Error('Request was aborted by user');
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(error);

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

    it('should handle error without name property', async () => {
      const error = { message: 'Some error' };
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(error);

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

    it('should handle error without message property', async () => {
      const error = new Error();
      error.message = undefined as unknown as string;
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(error);

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

    it('should handle null error', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(null);

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

    it('should handle undefined error', async () => {
      (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(undefined);

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

    it('selectEmail should return email', () => {
      expect(selectEmail(useAuthStore.getState())).toBe('user@test.com');
    });

    it('selectToken should return token', () => {
      expect(selectToken(useAuthStore.getState())).toBe('test-token');
    });

    it('selectLoginLoading should return login loading state', () => {
      expect(selectLoginLoading(useAuthStore.getState())).toBe(false);
    });

    it('selectLoginError should return login error', () => {
      expect(selectLoginError(useAuthStore.getState())).toBe('login error');
    });

    it('selectRegisterLoading should return register loading state', () => {
      expect(selectRegisterLoading(useAuthStore.getState())).toBe(true);
    });

    it('selectRegisterError should return register error', () => {
      expect(selectRegisterError(useAuthStore.getState())).toBe('register error');
    });

    it('selectIsAuthenticated should return true when token exists', () => {
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
    });

    it('selectIsAuthenticated should return false when token is null', () => {
      useAuthStore.setState({ token: null });
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
    });
  });

  describe('sanitizeAuthState', () => {
    it('should redact token when token exists', () => {
      const { sanitizeAuthState } = require('@/modules/User/features/Auth/stores/authStore');
      const stateWithToken = { ...useAuthStore.getState(), token: 'real-secret-token' };
      const result = sanitizeAuthState(stateWithToken);
      expect(result.token).toBe('[REDACTED]');
    });

    it('should keep null token as null', () => {
      const { sanitizeAuthState } = require('@/modules/User/features/Auth/stores/authStore');
      const stateWithoutToken = { ...useAuthStore.getState(), token: null };
      const result = sanitizeAuthState(stateWithoutToken);
      expect(result.token).toBeNull();
    });
  });
});
