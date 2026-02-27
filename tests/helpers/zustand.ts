import { useAuthStore } from '@/modules/User/features/Auth/stores/authStore';

type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends (...args: unknown[]) => unknown ? never : K]: T[K];
};

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
export const setAuthState = (
  state: Partial<NonFunctionProperties<ReturnType<typeof useAuthStore.getState>>>
): void => {
  useAuthStore.setState(state);
};
