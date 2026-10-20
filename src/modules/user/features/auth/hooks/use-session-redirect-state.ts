import { useState } from 'react';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

const COLD_VISIT: RedirectNavigationState = { focusMain: false };

const SIGNED_OUT_ARRIVAL: RedirectNavigationState = { focusMain: true };

const SESSION_ENDED_ARRIVAL: RedirectNavigationState = {
  focusMain: true,
  notice: 'session_ended',
};

export default function useSessionRedirectState(
  token: string | null,
  signedOut: boolean
): RedirectNavigationState {
  const [hadSession] = useState(Boolean(token));
  if (signedOut) return SIGNED_OUT_ARRIVAL;
  return hadSession ? SESSION_ENDED_ARRIVAL : COLD_VISIT;
}
