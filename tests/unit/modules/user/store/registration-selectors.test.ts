import {
  selectRegistrationError,
  selectRegistrationLoading,
  selectRegistrationRetryable,
  selectRegistrationUser,
} from '@/modules/user/store/registration-selectors';
import type { RootState } from '@/stores';

const state: RootState = {
  auth: { email: '', token: null, loading: false, error: null },
  registration: {
    user: { email: 'a@b.com', fullName: 'A B' },
    loading: true,
    error: 'boom',
    retryable: true,
  },
} as unknown as RootState;

describe('registration selectors', () => {
  it('selects user', () => {
    expect(selectRegistrationUser(state)).toEqual({ email: 'a@b.com', fullName: 'A B' });
  });

  it('selects loading flag', () => {
    expect(selectRegistrationLoading(state)).toBe(true);
  });

  it('selects error', () => {
    expect(selectRegistrationError(state)).toBe('boom');
  });

  it('selects retryable flag', () => {
    expect(selectRegistrationRetryable(state)).toBe(true);
  });
});
