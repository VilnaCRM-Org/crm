import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';

import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';
import useAuthStore from '@auth/stores/use-auth-store';

function onPendingChange(
  before: boolean | null,
  pending: boolean,
  goToChallenge: () => void
): void {
  if (before === null) {
    if (pending) useAuthStore.setState({ pendingSessionId: null });
    return;
  }
  if (pending && !before) goToChallenge();
}

export default function useTwoFactorRedirect(): void {
  const navigate = useNavigate();
  const from = (useLocation().state as RedirectNavigationState | null)?.from;
  const pending = useAuthStore((state) => state.pendingSessionId !== null);
  const previous = useRef<boolean | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = pending;
    onPendingChange(before, pending, () =>
      navigate(ROUTE_PATHS.twoFactorChallenge, { state: from === undefined ? {} : { from } })
    );
  }, [pending, navigate, from]);
}
