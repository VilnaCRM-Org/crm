import { useSyncExternalStore } from 'react';

import AuthStateVar from './auth-var';

class AuthTokenStore {
  // `onNextChange` registers one-shot listeners, so re-arm after every notification. The
  // `active` guard stays even though cleanup unregisters the armed listener: a broadcast
  // snapshotted before cleanup can still fire the listener afterwards.
  public static subscribe(onStoreChange: () => void): () => void {
    let active = true;
    const cancel = AuthTokenStore.relisten((): boolean => active, onStoreChange);
    return (): void => {
      active = false;
      cancel();
    };
  }

  public static snapshot(): string | null {
    return AuthStateVar.get().token;
  }

  // Returns a canceller that reads `cancel` lazily: every re-arm reassigns it, so cleanup
  // always unregisters the newest armed listener instead of orphaning it until the next
  // auth-state mutation.
  private static relisten(isActive: () => boolean, notify: () => void): () => void {
    let cancel = AuthStateVar.reactiveVar().onNextChange((): void => {
      if (isActive()) {
        cancel = AuthTokenStore.relisten(isActive, notify);
        notify();
      }
    });
    return (): void => cancel();
  }
}

// Token-sliced subscription: useSyncExternalStore skips the re-render whenever the
// selected snapshot is unchanged, unlike useAuthState which re-renders on every field.
export default function useAuthToken(): string | null {
  return useSyncExternalStore(AuthTokenStore.subscribe, AuthTokenStore.snapshot);
}
