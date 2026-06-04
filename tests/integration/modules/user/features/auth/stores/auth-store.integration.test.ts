import 'reflect-metadata';

import { useAuthStore } from '@auth/stores';
import AuthStoreSelectors from '@auth/stores/auth-store-selectors';

describe('auth store composition root', () => {
  it('wires a usable store from the DI container', () => {
    const state = useAuthStore.getState();
    expect(typeof state.loginUser).toBe('function');
    expect(typeof state.registerUser).toBe('function');
    expect(AuthStoreSelectors.isAuthenticated(state)).toBe(false);
  });
});
