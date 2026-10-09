import { create } from 'zustand';

import preloadedAuthTokenSeed from '@/config/env/preloaded-auth-token';
import type { AuthState } from '@auth/types/auth-store';

export const CLEARED_AUTH_STATE: AuthState = {
  email: '',
  token: null,
  user: null,
  loginLoading: false,
  loginError: null,
  registerLoading: false,
  registerError: null,
};

const useAuthStore = create<AuthState>()(() => ({
  ...CLEARED_AUTH_STATE,
  token: preloadedAuthTokenSeed.read(),
}));

export default useAuthStore;
