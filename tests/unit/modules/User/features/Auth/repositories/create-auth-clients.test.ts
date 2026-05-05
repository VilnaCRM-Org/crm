// @jest-environment node

import createAuthClients from '@/modules/User/features/Auth/repositories/create-auth-clients';
import LoginAPI from '@/modules/User/features/Auth/repositories/login-api';
import RegistrationAPI from '@/modules/User/features/Auth/repositories/registration-api';

describe('createAuthClients', () => {
  it('creates the auth API clients', () => {
    const clients = createAuthClients();

    expect(clients.loginAPI).toBeInstanceOf(LoginAPI);
    expect(clients.registrationAPI).toBeInstanceOf(RegistrationAPI);
  });
});
