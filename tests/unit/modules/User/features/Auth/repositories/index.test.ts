// @jest-environment node

import * as repositories from '@/modules/User/features/Auth/repositories';
import BaseAPI from '@/modules/User/features/Auth/repositories/base-api';
import createAuthClients from '@/modules/User/features/Auth/repositories/create-auth-clients';
import LoginAPI from '@/modules/User/features/Auth/repositories/login-api';
import RegistrationAPI from '@/modules/User/features/Auth/repositories/registration-api';

describe('repositories index', () => {
  it('re-exports the repository modules through the barrel', () => {
    expect(repositories.BaseAPI).toBe(BaseAPI);
    expect(repositories.createAuthClients).toBe(createAuthClients);
    expect(repositories.LoginAPI).toBe(LoginAPI);
    expect(repositories.RegistrationAPI).toBe(RegistrationAPI);
  });
});
