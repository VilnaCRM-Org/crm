import 'reflect-metadata';

import type { DependencyContainer } from 'tsyringe';

import TOKENS from '@/config/tokens';
import type LoginAPI from '@/modules/User/features/Auth/api/login-api';
import type RegistrationAPI from '@/modules/User/features/Auth/api/registration-api';
import createAuthClients from '@/modules/User/features/Auth/runtime/create-auth-clients';

describe('createAuthClients', () => {
  it('resolves auth APIs from the DI container', () => {
    const loginAPI = { login: jest.fn() } as unknown as LoginAPI;
    const registrationAPI = { register: jest.fn() } as unknown as RegistrationAPI;
    const resolve = jest
      .fn()
      .mockReturnValueOnce(loginAPI)
      .mockReturnValueOnce(registrationAPI);
    const container = { resolve } as Pick<DependencyContainer, 'resolve'> as DependencyContainer;
    const clients = createAuthClients(container);

    expect(resolve).toHaveBeenNthCalledWith(1, TOKENS.LoginAPI);
    expect(resolve).toHaveBeenNthCalledWith(2, TOKENS.RegistrationAPI);
    expect(clients.loginAPI).toBe(loginAPI);
    expect(clients.registrationAPI).toBe(registrationAPI);
  });
});
