import { type RefCallback, useContext, useEffect, useMemo } from 'react';
import {
  type Location,
  NavigationType,
  UNSAFE_DataRouterContext,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router';

import type { RedirectNavigationState } from '@/routes/types/navigation-state';

const INITIAL_LOCATION_KEY = 'default';

function withoutOneTimeMarkers(state: RedirectNavigationState | null): RedirectNavigationState {
  return state?.from ? { from: state.from, focusMain: false } : { focusMain: false };
}

function carriesMarker(location: Location<RedirectNavigationState | null>): boolean {
  return Boolean(location.state?.focusMain);
}

function isRevisit(location: Location, action: NavigationType): boolean {
  return action === NavigationType.Pop && location.key !== INITIAL_LOCATION_KEY;
}

function focusRefFor(
  location: Location<RedirectNavigationState | null>,
  action: NavigationType
): RefCallback<HTMLElement> | null {
  if (!carriesMarker(location) || isRevisit(location, action)) return null;

  return (node) => {
    if (node?.closest('[aria-hidden="true"]') === null) node.focus();
  };
}

export default function useArrivalFocus(): RefCallback<HTMLElement> | null {
  const location = useLocation() as Location<RedirectNavigationState | null>;
  const action = useNavigationType();
  const navigate = useNavigate();
  const router = useContext(UNSAFE_DataRouterContext)?.router;

  useEffect(() => {
    const currentKey = router?.state.location.key ?? location.key;
    if (!carriesMarker(location) || currentKey !== location.key) return;

    navigate(location, { replace: true, state: withoutOneTimeMarkers(location.state) });
  }, [location, navigate, router]);

  return useMemo(() => focusRefFor(location, action), [action, location]);
}
