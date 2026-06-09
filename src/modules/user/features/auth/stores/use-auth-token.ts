import { useSyncExternalStore } from 'react';

import AuthStateVar from './auth-var';

class AuthTokenStore {
  // `onNextChange` registers one-shot listeners, so re-arm after every notification.
  public static subscribe(onStoreChange: () => void): () => void {
    let active = true;
    AuthTokenStore.relisten(() => {
      if (active) onStoreChange();
      return active;
    });
    return (): void => {
      active = false;
    };
  }

  public static snapshot(): string | null {
    return AuthStateVar.get().token;
  }

  private static relisten(notify: () => boolean): void {
    AuthStateVar.reactiveVar().onNextChange(() => {
      if (notify()) AuthTokenStore.relisten(notify);
    });
  }
}

// Token-sliced subscription: useSyncExternalStore skips the re-render whenever the
// selected snapshot is unchanged, unlike useAuthState which re-renders on every field.
export default function useAuthToken(): string | null {
  return useSyncExternalStore(AuthTokenStore.subscribe, AuthTokenStore.snapshot);
}
