import { selectRegisterRetryable, selectRegisterUser, useAuthStore } from '@/stores/auth-store';

describe('auth-selectors (integration)', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('reads registerRetryable from the live store', () => {
    useAuthStore.setState({ registerRetryable: true });
    expect(selectRegisterRetryable(useAuthStore.getState())).toBe(true);

    useAuthStore.setState({ registerRetryable: undefined });
    expect(selectRegisterRetryable(useAuthStore.getState())).toBeUndefined();
  });

  it('reads the registered user from the live store', () => {
    expect(selectRegisterUser(useAuthStore.getState())).toBeNull();

    useAuthStore.setState({ user: { fullName: 'Sample User', email: 'sample@user.test' } });
    expect(selectRegisterUser(useAuthStore.getState())).toEqual({
      fullName: 'Sample User',
      email: 'sample@user.test',
    });
  });
});
