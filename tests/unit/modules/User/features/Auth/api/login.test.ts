import 'reflect-metadata';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { login } from '@/modules/User/features/Auth/api/login';
import type LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';

const mockLoginAPI = { login: jest.fn() } as unknown as LoginAPI;

describe('login()', () => {
  beforeEach(() => {
    container.clearInstances();
    container.registerInstance(TOKENS.LoginAPI, mockLoginAPI);
    jest.clearAllMocks();
  });

  it('returns success with lowercased email and token', async () => {
    (mockLoginAPI.login as jest.Mock).mockResolvedValue({ token: 'tok-123' });
    const result = await login({ email: 'Test@Example.COM', password: 'pw' });
    expect(result).toEqual({ status: 'success', email: 'test@example.com', token: 'tok-123' });
  });

  it('returns error when Zod parse fails (missing token)', async () => {
    (mockLoginAPI.login as jest.Mock).mockResolvedValue({ invalid: true });
    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result.status).toBe('error');
    expect((result as { status: 'error'; message: string }).message).toBeTruthy();
  });

  it('returns aborted for DOMException AbortError', async () => {
    (mockLoginAPI.login as jest.Mock).mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({ status: 'aborted' });
  });

  it('returns aborted for Error with name AbortError', async () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    (mockLoginAPI.login as jest.Mock).mockRejectedValue(err);
    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({ status: 'aborted' });
  });

  it('returns error for a network error', async () => {
    (mockLoginAPI.login as jest.Mock).mockRejectedValue(new Error('Network failure'));
    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result.status).toBe('error');
    expect((result as { status: 'error'; message: string }).message).toBeTruthy();
  });

  it('returns mapped auth error when API-shaped error is thrown', async () => {
    (mockLoginAPI.login as jest.Mock).mockRejectedValue({
      code: 'AUTH_INVALID',
      message: 'Invalid credentials',
    });
    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({
      status: 'error',
      message: 'Invalid credentials',
    });
  });

  it('returns error for null thrown', async () => {
    (mockLoginAPI.login as jest.Mock).mockRejectedValue(null);
    const result = await login({ email: 'a@b.com', password: 'pw' });
    expect(result.status).toBe('error');
  });
});
