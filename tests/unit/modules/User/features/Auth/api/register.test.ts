import 'reflect-metadata';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import { register } from '@/modules/User/features/Auth/api/register';
import type RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';

const mockRegistrationAPI = { register: jest.fn() } as unknown as RegistrationAPI;

describe('register()', () => {
  beforeEach(() => {
    container.clearInstances();
    container.registerInstance(TOKENS.RegistrationAPI, mockRegistrationAPI);
    jest.clearAllMocks();
  });

  it('returns success for a valid empty-object response', async () => {
    (mockRegistrationAPI.register as jest.Mock).mockResolvedValue({});
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({ status: 'success' });
  });

  it('returns error when Zod parse fails (wrong field types)', async () => {
    (mockRegistrationAPI.register as jest.Mock).mockResolvedValue({ fullName: 123, email: 456 });
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result.status).toBe('error');
    expect((result as { status: 'error'; message: string }).message).toBeTruthy();
  });

  it('returns aborted for DOMException AbortError', async () => {
    (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(
      new DOMException('Aborted', 'AbortError')
    );
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({ status: 'aborted' });
  });

  it('returns aborted for Error with name AbortError', async () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(err);
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({ status: 'aborted' });
  });

  it('returns error for a network error', async () => {
    (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(new Error('Network failure'));
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result.status).toBe('error');
    expect((result as { status: 'error'; message: string }).message).toBeTruthy();
  });

  it('returns mapped auth error when API-shaped error is thrown', async () => {
    (mockRegistrationAPI.register as jest.Mock).mockRejectedValue({
      code: 'AUTH_INVALID',
      message: 'Invalid credentials',
    });
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result).toEqual({
      status: 'error',
      message: 'Invalid credentials',
    });
  });

  it('returns error for null thrown', async () => {
    (mockRegistrationAPI.register as jest.Mock).mockRejectedValue(null);
    const result = await register({ fullName: 'Ada', email: 'a@b.com', password: 'pw' });
    expect(result.status).toBe('error');
  });
});
