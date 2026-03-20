import {
  selectRegistrationError,
  selectRegistrationLoading,
  selectRegistrationRetryable,
  selectRegistrationUser,
} from '@/modules/user/store/registration-selectors';
import type { RootState } from '@/stores';

describe('registration selectors', () => {
  const user = {
    fullName: 'Test User',
    email: 'user@example.com',
  };

  const state = {
    auth: {
      email: '',
      token: null,
      loading: false,
      error: null,
    },
    registration: {
      user,
      loading: true,
      error: 'Registration failed',
      retryable: true,
    },
  } as RootState;

  it('selects the registration user', () => {
    expect(selectRegistrationUser(state)).toEqual(user);
  });

  it('selects the registration loading state', () => {
    expect(selectRegistrationLoading(state)).toBe(true);
  });

  it('selects the registration error', () => {
    expect(selectRegistrationError(state)).toBe('Registration failed');
  });

  it('selects whether the registration request is retryable', () => {
    expect(selectRegistrationRetryable(state)).toBe(true);
  });
});
