import { useLayoutEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import usePrincipal from '@/hooks/use-principal';
import accessSession from '@/lib/access/access-session';
import AuthStateVar from '@auth/stores/auth-var';
import useAuthToken from '@auth/stores/use-auth-token';

// Hydrate before the first render, not from an effect. useSyncExternalStore subscribes in a
// PASSIVE effect, so a store write issued from a layout effect during the same commit
// notifies nobody: the gated page would render null, skip its own chunk request, and only
// recover a scheduler task later — an empty first frame on the Lighthouse-audited route.
accessSession.sync(AuthStateVar.get());

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthToken();
  const hydrated = usePrincipal() !== null;

  // Re-syncs on a token change, and re-hydrates if the session was ended out from under a
  // still-valid token (which would otherwise leave every gated route blank).
  useLayoutEffect(() => {
    accessSession.sync({ token });
  }, [token, hydrated]);

  return token ? <Outlet /> : <Navigate to="/sign-in" replace />;
}
