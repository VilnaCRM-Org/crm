import 'reflect-metadata';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import { useAuthStore } from '@/modules/User/features/Auth/stores/authStore';

const mockLoginAPI = {
  login: jest.fn(),
} as unknown as LoginAPI;

function createDelayedPromise(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('authStore', () => {
  beforeEach(() => {
    container.clearInstances();
    container.registerInstance(TOKENS.LoginAPI, mockLoginAPI);
    jest.clearAllMocks();
  });

  afterEach(() => {
    useAuthStore.getState().reset();
  });

  it('should have initial state', () => {
    const state = useAuthStore.getState();

    expect(state.email).toBe('');
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should reset state', () => {
    const { reset } = useAuthStore.getState();

    useAuthStore.setState({
      email: 'test@example.com',
      token: 'test-token',
      loading: true,
      error: 'test error',
    });

    reset();

    const state = useAuthStore.getState();
    expect(state.email).toBe('');
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
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
      expect(state.loading).toBe(false);
      expect(state.email).toBe('test@example.com');
      expect(state.token).toBe('test-token-123');
      expect(state.error).toBeNull();
    });

    it('should set loading state during login', async () => {
      (mockLoginAPI.login as jest.Mock).mockImplementation(() => createDelayedPromise(100));

      const { loginUser } = useAuthStore.getState();
      const loginPromise = loginUser({ email: 'test@example.com', password: 'password123' });

      // Check loading state immediately
      expect(useAuthStore.getState().loading).toBe(true);

      await loginPromise;
    });

    it('should handle validation error from API response', async () => {
      const mockResponse = { invalid: 'response' };
      (mockLoginAPI.login as jest.Mock).mockResolvedValue(mockResponse);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.error).toContain('Invalid input');
      expect(state.token).toBeNull();
    });

    it('should handle API error', async () => {
      const mockError = new Error('Network error');
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(mockError);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.token).toBeNull();
    });

    it('should handle abort signal with DOMException', async () => {
      const abortController = new AbortController();
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(new DOMException('Aborted', 'AbortError'));

      const { loginUser } = useAuthStore.getState();
      const loginPromise = loginUser(
        { email: 'test@example.com', password: 'password123' },
        abortController.signal
      );

      abortController.abort();
      await loginPromise;

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle abort error with name === "AbortError"', async () => {
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(abortError);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error with "abort" in message', async () => {
      const error = new Error('Request was aborted by user');
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(error);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error without name property', async () => {
      const error = { message: 'Some error' };
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(error);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle error without message property', async () => {
      const error = new Error();
      error.message = undefined as unknown as string;
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(error);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle null error', async () => {
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(null);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle undefined error', async () => {
      (mockLoginAPI.login as jest.Mock).mockRejectedValue(undefined);

      const { loginUser } = useAuthStore.getState();
      await loginUser({ email: 'test@example.com', password: 'password123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  describe('selectors', () => {
    beforeEach(() => {
      useAuthStore.setState({
        email: 'user@test.com',
        token: 'test-token',
        loading: false,
        error: 'test error',
      });
    });

    it('selectEmail should return email', () => {
      const { selectEmail } = require('@/modules/User/features/Auth/stores/authStore');
      expect(selectEmail(useAuthStore.getState())).toBe('user@test.com');
    });

    it('selectToken should return token', () => {
      const { selectToken } = require('@/modules/User/features/Auth/stores/authStore');
      expect(selectToken(useAuthStore.getState())).toBe('test-token');
    });

    it('selectLoading should return loading state', () => {
      const { selectLoading } = require('@/modules/User/features/Auth/stores/authStore');
      expect(selectLoading(useAuthStore.getState())).toBe(false);
    });

    it('selectError should return error', () => {
      const { selectError } = require('@/modules/User/features/Auth/stores/authStore');
      expect(selectError(useAuthStore.getState())).toBe('test error');
    });

    it('selectIsAuthenticated should return true when token exists', () => {
      const { selectIsAuthenticated } = require('@/modules/User/features/Auth/stores/authStore');
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
    });

    it('selectIsAuthenticated should return false when token is null', () => {
      const { selectIsAuthenticated } = require('@/modules/User/features/Auth/stores/authStore');
      useAuthStore.setState({ token: null });
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
    });
  });
});
