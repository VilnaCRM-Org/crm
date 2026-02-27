import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import { useAuthStore } from '@/modules/User/features/Auth/stores/authStore';

import server from '../../../mocks/server';

const registrationCredentials = {
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User',
};

function createDelayedPromise(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('Auth Store Integration', () => {
  beforeEach(() => {
    container.clearInstances();
    useAuthStore.getState().reset();
  });

  afterEach(() => {
    useAuthStore.getState().reset();
    server.resetHandlers();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.email).toBe('');
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('successful login flow', () => {
    it('should update state to pending when login starts', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.delay(50), ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      let loadingWasTrue = false;
      const unsubscribe = useAuthStore.subscribe((state) => {
        if (state.loading) {
          loadingWasTrue = true;
        }
      });

      const promise = useAuthStore.getState().loginUser({ email: 'user@test.com', password: 'pass' });

      await promise;

      unsubscribe();
      expect(loadingWasTrue).toBe(true);
    });

    it('should update state on successful login', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'user@example.com', password: 'pass123' });

      const state = useAuthStore.getState();

      expect(state.loading).toBe(false);
      expect(state.email).toBe('user@example.com');
      expect(state.token).toBe('token123');
      expect(state.error).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token-abc' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'USER@TEST.COM', password: 'pass' });

      const state = useAuthStore.getState();
      expect(state.email).toBe('user@test.com');
    });

    it('should handle multiple successful logins', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'first-token' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'first@test.com', password: 'pass' });
      expect(useAuthStore.getState().token).toBe('first-token');

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'second-token' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'second@test.com', password: 'pass' });

      const state = useAuthStore.getState();
      expect(state.token).toBe('second-token');
      expect(state.email).toBe('second@test.com');
    });
  });

  describe('error handling', () => {
    it('should set error state on 401 authentication error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid credentials' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'bad@test.com', password: 'badpass' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on network failure', async () => {
      server.use(rest.post(API_ENDPOINTS.LOGIN, (_, res) => res.networkError('Failed to fetch')));

      await useAuthStore.getState().loginUser({ email: 'test@test.com', password: 'pass' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.token).toBeNull();
      expect(state.error).toBeTruthy();
    });

    it('should set error state on 400 validation error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Invalid data' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'invalid', password: '123' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should clear previous error on new login attempt', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(401), ctx.json({ message: 'Invalid' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'test@test.com', password: 'pass' });
      expect(useAuthStore.getState().error).toBeTruthy();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'new-token' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'test@test.com', password: 'correctpass' });

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.token).toBe('new-token');
    });

    it('should handle 500 server error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal server error' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'test@test.com', password: 'pass' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle various HTTP error codes', async () => {
      const errorCodes = [403, 404, 408, 422, 429, 502, 503, 504];

      for (const code of errorCodes) {
        useAuthStore.getState().reset();
        server.use(
          rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
            res(ctx.status(code), ctx.json({ message: `Error ${code}` }))
          )
        );

        await useAuthStore.getState().loginUser({ email: 'test@test.com', password: 'pass' });

        const state = useAuthStore.getState();
        expect(state.loading).toBe(false);
        expect(state.error).toBeTruthy();
      }
    });
  });

  describe('logout action', () => {
    it('should clear all auth state on logout', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'token123' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'user@test.com', password: 'pass' });
      expect(useAuthStore.getState().token).toBe('token123');
      expect(useAuthStore.getState().email).toBe('user@test.com');

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.email).toBe('');
      expect(state.error).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('request cancellation', () => {
    it('should handle cancelled requests', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, async (_, res, ctx) => {
          await createDelayedPromise(100);
          return res(ctx.status(200), ctx.json({ token: 'token' }));
        })
      );

      const abortController = new AbortController();
      const promise = useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' },
        abortController.signal
      );

      abortController.abort();
      await promise;

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('schema validation', () => {
    it('should handle invalid response schema', async () => {
      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ invalidField: 'value' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'test@test.com', password: 'pass' });

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
      expect(state.token).toBeNull();
    });
  });

  describe('registerUser', () => {
    it('should handle successful registration', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({ fullName: 'Test User', email: 'test@example.com' }))
        )
      );

      await useAuthStore.getState().registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set loading state during registration', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, async (_, res, ctx) => {
          await createDelayedPromise(50);
          return res(
            ctx.status(201),
            ctx.json({ fullName: 'Test User', email: 'test@example.com' })
          );
        })
      );

      let loadingWasTrue = false;
      const unsubscribe = useAuthStore.subscribe((state) => {
        if (state.loading) {
          loadingWasTrue = true;
        }
      });

      await useAuthStore.getState().registerUser(registrationCredentials);

      unsubscribe();
      expect(loadingWasTrue).toBe(true);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle validation error from API response', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ fullName: 123, email: 456 }))
        )
      );

      await useAuthStore.getState().registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 400 error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Bad request' }))
        )
      );

      await useAuthStore.getState().registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle 409 conflict error', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(409), ctx.json({ message: 'User already exists' }))
        )
      );

      await useAuthStore.getState().registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle network failure', async () => {
      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res) => res.networkError('Failed to fetch'))
      );

      await useAuthStore.getState().registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle pre-aborted signal', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await useAuthStore.getState().registerUser(
        registrationCredentials,
        abortController.signal
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loginUser abort handling', () => {
    it('should handle pre-aborted signal', async () => {
      const abortController = new AbortController();
      abortController.abort();

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' },
        abortController.signal
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle DOMException abort from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(
        new DOMException('The operation was aborted', 'AbortError')
      );

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error with AbortError name from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const abortError = new Error('Operation cancelled');
      abortError.name = 'AbortError';
      jest.spyOn(loginAPI, 'login').mockRejectedValue(abortError);

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle error with abort in message from LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(
        new Error('Request was aborted by user')
      );

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should not treat non-abort errors as abort', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(
        new Error('Network failure')
      );

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should not treat non-Error objects as abort', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue('string error');

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle null error thrown by LoginAPI', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      jest.spyOn(loginAPI, 'login').mockRejectedValue(null);

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should handle error with undefined message', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      const error = new Error();
      error.message = undefined as unknown as string;
      jest.spyOn(loginAPI, 'login').mockRejectedValue(error);

      await useAuthStore.getState().loginUser(
        { email: 'test@test.com', password: 'pass' }
      );

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  describe('selectors', () => {
    it('should select state values correctly', async () => {
      const {
        selectEmail,
        selectToken,
        selectLoading,
        selectError,
        selectIsAuthenticated,
      } = require('@/modules/User/features/Auth/stores/authStore');

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'sel-token' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'sel@test.com', password: 'pass' });

      const state = useAuthStore.getState();
      expect(selectEmail(state)).toBe('sel@test.com');
      expect(selectToken(state)).toBe('sel-token');
      expect(selectLoading(state)).toBe(false);
      expect(selectError(state)).toBeNull();
      expect(selectIsAuthenticated(state)).toBe(true);

      useAuthStore.getState().logout();
      const loggedOut = useAuthStore.getState();
      expect(selectIsAuthenticated(loggedOut)).toBe(false);
    });
  });

  describe('real integration with DI container', () => {
    it('should use real LoginAPI from DI container', async () => {
      const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);
      expect(loginAPI).toBeDefined();

      server.use(
        rest.post(API_ENDPOINTS.LOGIN, (_, res, ctx) =>
          res(ctx.status(200), ctx.json({ token: 'di-token' }))
        )
      );

      await useAuthStore.getState().loginUser({ email: 'di@test.com', password: 'pass' });

      const state = useAuthStore.getState();
      expect(state.token).toBe('di-token');
      expect(state.email).toBe('di@test.com');
    });

    it('should use real RegistrationAPI from DI container', async () => {
      const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);
      expect(registrationAPI).toBeDefined();

      server.use(
        rest.post(API_ENDPOINTS.REGISTER, (_, res, ctx) =>
          res(ctx.status(201), ctx.json({}))
        )
      );

      await useAuthStore.getState().registerUser(registrationCredentials);

      const state = useAuthStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
