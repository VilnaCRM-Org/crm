// @jest-environment node

import * as repositories from '@/modules/user/features/auth/repositories';
import BaseAPI from '@/modules/user/features/auth/repositories/base-api';
import createAuthClients from '@/modules/user/features/auth/repositories/create-auth-clients';
import LoginAPI from '@/modules/user/features/auth/repositories/login-api';
import RegistrationAPI from '@/modules/user/features/auth/repositories/registration-api';

describe('repositories index', () => {
  it('re-exports the repository modules through the barrel', () => {
    expect(repositories.BaseAPI).toBe(BaseAPI);
    expect(repositories.createAuthClients).toBe(createAuthClients);
    expect(repositories.LoginAPI).toBe(LoginAPI);
    expect(repositories.RegistrationAPI).toBe(RegistrationAPI);
  });
});
