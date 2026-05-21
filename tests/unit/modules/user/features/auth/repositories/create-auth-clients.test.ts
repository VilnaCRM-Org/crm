// @jest-environment node

import createAuthClients from '@/modules/user/features/auth/repositories/create-auth-clients';
import LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import RegistrationAPI from '@/modules/user/features/auth/repositories/registration-api';

describe('createAuthClients', () => {
  it('creates the auth API clients', () => {
    const clients = createAuthClients();

    expect(clients.loginAPI).toBeInstanceOf(LoginAPI);
    expect(clients.registrationAPI).toBeInstanceOf(RegistrationAPI);
  });
});
