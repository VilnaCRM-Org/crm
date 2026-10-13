import { create } from 'zustand';

import preloadedAuthTokenSeed from '@/config/env/preloaded-auth-token';
import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
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

const useAuthStore = create<AuthState>()(() => {
  const demoSession = sandboxDemoSessionProvider.restore();

  return {
    ...CLEARED_AUTH_STATE,
    email: demoSession?.email ?? CLEARED_AUTH_STATE.email,
    token: demoSession?.token ?? preloadedAuthTokenSeed.read(),
  };
});

export default useAuthStore;
