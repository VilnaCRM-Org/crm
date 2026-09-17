import useReactiveVar from '@/lib/state/use-reactive-var';
import type { AuthState } from '@auth/types/auth-store';

import authStoreSelectors from './auth-store-selectors';
import authStateVar from './auth-var';

export default function useAuthToken(): string | null {
  return useReactiveVar(authStateVar.reactiveVar(), (state: AuthState): string | null =>
    authStoreSelectors.token(state)
  );
}
