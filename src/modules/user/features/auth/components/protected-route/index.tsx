import type { JSX } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import type { ProtectedSessionContext } from '@/routes/types/protected-outlet-context';
import useSessionRedirectState from '@auth/hooks/use-session-redirect-state';
import authSessionProvider from '@auth/stores/auth-session-provider';
import useAuthToken from '@auth/stores/use-auth-token';
import useSignOut from '@auth/stores/use-sign-out';

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthToken();
  const location = useLocation();
  const { signedOut, signOut } = useSignOut();
  const redirectState = useSessionRedirectState(token, signedOut);
  const outletContext: ProtectedSessionContext = { signOut, session: authSessionProvider };

  return token ? (
    <Outlet context={outletContext} />
  ) : (
    <Navigate to="/sign-in" replace state={{ from: location, ...redirectState }} />
  );
}
