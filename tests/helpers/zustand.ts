import { useAuthStore } from '@/modules/User/features/Auth/stores/authStore';

/**
 * Reset all Zustand stores to initial state
 * Call this in afterEach or beforeEach in tests
 */
export const resetAllStores = (): void => {
  useAuthStore.getState().reset();
};

/**
 * Set initial auth state for testing
 */
export const setAuthState = (state: Partial<ReturnType<typeof useAuthStore.getState>>): void => {
  useAuthStore.setState(state);
};
