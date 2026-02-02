import { rest } from 'msw';

import '../../../setup';
import API_ENDPOINTS from '@/config/apiConfig';
import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import { useAuthStore } from '@/stores/zustand/authStore';

import server from '../../../mocks/server';

describe('Auth Store Integration', () => {
  beforeEach(() => {
    container.clearInstances();
    useAuthStore.getState().reset();
  });

  afterEach(() => {
    useAuthStore.getState().reset();
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

      const promise = useAuthStore.getState().loginUser({ email: 'user@test.com', password: 'pass' });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });
      expect(useAuthStore.getState().loading).toBe(true);
      expect(useAuthStore.getState().error).toBeNull();

      await promise;
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
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
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
  });
});
