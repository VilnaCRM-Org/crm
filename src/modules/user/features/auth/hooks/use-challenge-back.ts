import { useLocation, useNavigate } from 'react-router';

import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

export default function useChallengeBack(): () => void {
  const navigate = useNavigate();
  const from = (useLocation().state as RedirectNavigationState | null)?.from;
  return (): void => {
    void navigate(ROUTE_PATHS.signIn, {
      state: from === undefined ? { focusMain: true } : { from, focusMain: true },
    });
  };
}
