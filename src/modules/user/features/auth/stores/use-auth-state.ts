import { useSyncExternalStore } from 'react';

import type { AuthState } from '@auth/types/auth-store';

import authStateVar from './auth-var';

// Bind once at module scope so useSyncExternalStore receives a stable subscribe
// reference and does not re-subscribe on every render.
const subscribe = (onStoreChange: () => void): (() => void) =>
  authStateVar.reactiveVar().subscribe(onStoreChange);
const getSnapshot = (): AuthState => authStateVar.get();

export default function useAuthState(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
