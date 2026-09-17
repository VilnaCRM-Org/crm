import useReactiveVar from '@/lib/state/use-reactive-var';
import type { AuthState } from '@auth/types/auth-store';

import authStateVar from './auth-var';

export default function useAuthState(): AuthState {
  return useReactiveVar(authStateVar.reactiveVar(), (state: AuthState): AuthState => state);
}
