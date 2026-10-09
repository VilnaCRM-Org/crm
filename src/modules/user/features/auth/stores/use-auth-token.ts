import type { AuthState } from '@auth/types/auth-store';

import authStoreSelectors from './auth-store-selectors';
import useAuthStore from './use-auth-store';

export default function useAuthToken(): string | null {
  return useAuthStore((state: AuthState): string | null => authStoreSelectors.token(state));
}
