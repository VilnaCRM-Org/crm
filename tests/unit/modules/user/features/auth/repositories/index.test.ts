import 'reflect-metadata';

import * as repositories from '@auth/repositories';

describe('auth repositories barrel', () => {
  it('re-exports every public class from the auth repositories module', () => {
    expect(typeof repositories.ApiErrorFactory).toBe('function');
    expect(typeof repositories.ApiStatusErrorFactory).toBe('function');
    expect(typeof repositories.AuthErrorFactory).toBe('function');
    expect(typeof repositories.BaseAPI).toBe('function');
    expect(typeof repositories.GraphQLPasswordRecoveryRepository).toBe('function');
    expect(typeof repositories.GraphQLSignInRepository).toBe('function');
    expect(typeof repositories.RegistrationAPI).toBe('function');
  });

  it('exports exactly the public classes of the auth repositories module', () => {
    expect(Object.keys(repositories).sort()).toEqual([
      'ApiErrorFactory',
      'ApiStatusErrorFactory',
      'AuthErrorFactory',
      'BaseAPI',
      'GraphQLPasswordRecoveryRepository',
      'GraphQLSignInRepository',
      'RegistrationAPI',
    ]);
  });
});
