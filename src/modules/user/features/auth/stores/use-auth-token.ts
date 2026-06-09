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

  // Re-arms the same listener closure and reassigns the single `cancel` binding, keeping
  // retention and unsubscribe depth O(1) across auth changes. The returned canceller reads
  // `cancel` lazily so cleanup always unregisters the newest armed listener.
  private static relisten(isActive: () => boolean, notify: () => void): () => void {
    let cancel: () => void;
    const listener = (): void => {
      if (isActive()) {
        cancel = AuthStateVar.reactiveVar().onNextChange(listener);
        notify();
      }
    };
    cancel = AuthStateVar.reactiveVar().onNextChange(listener);
    return (): void => cancel();
  }
}

// Token-sliced subscription: useSyncExternalStore skips the re-render whenever the
// selected snapshot is unchanged, unlike useAuthState which re-renders on every field.
export default function useAuthToken(): string | null {
  return useSyncExternalStore(AuthTokenStore.subscribe, AuthTokenStore.snapshot);
}
