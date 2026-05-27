import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import { AuthClients } from '@auth/repositories';
import LoginAPI from '@auth/repositories/login-api';
import RegistrationAPI from '@auth/repositories/registration-api';

describe('AuthClients', () => {
  it('resolves login and registration APIs via dependency injection', () => {
    const clients = container.resolve<AuthClients>(TOKENS.AuthClients);

    expect(clients.loginAPI).toBeInstanceOf(LoginAPI);
    expect(clients.registrationAPI).toBeInstanceOf(RegistrationAPI);
  });

  it('exposes APIs passed directly to the constructor', () => {
    const loginAPI = {} as LoginAPI;
    const registrationAPI = {} as RegistrationAPI;
    const clients = new AuthClients(loginAPI, registrationAPI);

    expect(clients.loginAPI).toBe(loginAPI);
    expect(clients.registrationAPI).toBe(registrationAPI);
  });
});
