import { useState } from 'react';

import ChunkRetryLoader from '@/lib/reliability/chunk-retry-loader';
import observabilityCore from '@/services/observability/observability-core';
import type { SignOutState } from '@auth/types/sign-out';

const authStoreLoader = new ChunkRetryLoader(() => import('./index'));

export default function useSignOut(): SignOutState {
  const [signedOut, setSignedOut] = useState(false);

  const signOut = (): void => {
    setSignedOut(true);
    authStoreLoader
      .load()
      .then(({ authActions }) => authActions.logout())
      .catch((error: unknown) => {
        setSignedOut(false);
        observabilityCore.captureError(error, { source: 'auth:sign-out' });
      });
  };

  return { signedOut, signOut };
}
