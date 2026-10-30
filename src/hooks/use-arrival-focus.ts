import { type RefCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

const focusOnArrival: RefCallback<HTMLElement> = (node) => {
  if (node?.closest('[aria-hidden="true"]') === null) node.focus();
};

function withoutOneTimeMarkers(state: RedirectNavigationState | null): RedirectNavigationState {
  return state?.from ? { from: state.from, focusMain: false } : { focusMain: false };
}

export default function useArrivalFocus(): RefCallback<HTMLElement> | null {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as RedirectNavigationState | null;
  const focusMain = Boolean(state?.focusMain);

  useEffect(() => {
    if (!focusMain) return;

    navigate(location, { replace: true, state: withoutOneTimeMarkers(state) });
  }, [focusMain, location, navigate, state]);

  return focusMain ? focusOnArrival : null;
}
