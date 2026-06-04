import 'reflect-metadata';

import {
  ApiErrorFactory,
  ApiStatusErrorFactory,
  BaseAPI,
  LoginAPI,
  RegistrationAPI,
} from '@auth/repositories';

describe('auth repositories barrel', () => {
  it('re-exports every public class from the auth repositories module', () => {
    expect(typeof ApiErrorFactory).toBe('function');
    expect(typeof ApiStatusErrorFactory).toBe('function');
    expect(typeof BaseAPI).toBe('function');
    expect(typeof LoginAPI).toBe('function');
    expect(typeof RegistrationAPI).toBe('function');
  });
});
