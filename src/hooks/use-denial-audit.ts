import { useEffect, useRef } from 'react';

import accessCore from '@/lib/access/access-core';
import type { MutationKey } from '@/lib/types/access/mutation-access';

// One refusal is one event, and the refusal's identity — who was refused which mutation, and
// where — is what the effect keys on, so StrictMode replaying the mount effect for the same
// refusal records nothing twice. The ref tracks the current refusal rather than only the last
// recorded one: an allowance clears it, so a later re-denial of that same identity is its
// own episode instead of being swallowed for the lifetime of the mount.
export default function useDenialAudit(
  refusal: string | null,
  mutation: MutationKey,
  path: string
): void {
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    if (recorded.current === refusal) return;
    recorded.current = refusal;
    if (refusal !== null) accessCore.recordDenial(mutation, { path });
  }, [refusal, mutation, path]);
}
