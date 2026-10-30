import { useRef, useState } from 'react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import observabilityCore from '@/services/observability/observability-core';
import type { SignOutState } from '@auth/types/sign-out';

const authStoreLoader = new ChunkRetryLoader(() => import('./index'));

function logOut(release: () => void): void {
  authStoreLoader
    .load()
    .then(({ authActions }) => authActions.logout())
    .catch((error: unknown) => {
      release();
      observabilityCore.captureError(error, { source: 'auth:sign-out' });
    });
}

export default function useSignOut(): SignOutState {
  const [signedOut, setSignedOut] = useState(false);
  const pending = useRef(false);

  const hold = (held: boolean): void => {
    pending.current = held;
    setSignedOut(held);
  };
  const signOut = (): void => {
    if (pending.current) return;
    hold(true);
    logOut(() => hold(false));
  };

  return { signedOut, signOut };
}
