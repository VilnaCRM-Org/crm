import 'reflect-metadata';

import type { DependencyContainer } from 'tsyringe';

import TOKENS from '@/config/tokens';
import createAuthClients from '@/stores/auth-clients';
import { AuthClients } from '@auth/repositories';

describe('createAuthClients', () => {
  it('resolves the AuthClients singleton from a custom DI container', () => {
    const stub = { loginAPI: {}, registrationAPI: {} } as AuthClients;
    const resolve = jest.fn().mockReturnValue(stub);
    const dependencyContainer = {
      resolve,
    } as Pick<DependencyContainer, 'resolve'> as DependencyContainer;

    const clients = createAuthClients(dependencyContainer);

    expect(resolve).toHaveBeenCalledWith(TOKENS.AuthClients);
    expect(clients).toBe(stub);
  });

  it('falls back to the default container when no argument is provided', () => {
    const clients = createAuthClients();

    expect(clients).toBeInstanceOf(AuthClients);
  });
});
