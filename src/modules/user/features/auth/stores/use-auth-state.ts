import type { AuthState } from '@auth/types/auth-store';

import useAuthStore from './use-auth-store';

export default function useAuthState(): AuthState {
  return useAuthStore();
}
