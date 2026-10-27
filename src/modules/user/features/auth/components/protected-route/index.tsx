import type { JSX } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import type {
  ProtectedOutletContext,
  TwoFactorStatus,
} from '@/routes/types/protected-outlet-context';
import useRecoveryCodesBanner from '@auth/hooks/use-recovery-codes-banner';
import useSessionRedirectState from '@auth/hooks/use-session-redirect-state';
import useAuthStore from '@auth/stores/use-auth-store';
import useAuthToken from '@auth/stores/use-auth-token';
import useSignOut from '@auth/stores/use-sign-out';
import type { AuthState, AuthStatePatch } from '@auth/types/auth-store';

const setTwoFactorStatus = (twoFactorStatus: TwoFactorStatus): void => {
  const patch: AuthStatePatch = { twoFactorStatus };
  useAuthStore.setState(patch);
};

export default function ProtectedRoute(): JSX.Element {
  const token = useAuthToken();
  const twoFactorStatus = useAuthStore((state: AuthState) => state.twoFactorStatus);
  const location = useLocation();
  const { signedOut, signOut } = useSignOut();
  const redirectState = useSessionRedirectState(token, signedOut);
  const banner = useRecoveryCodesBanner();
  const outletContext: ProtectedOutletContext = {
    signOut,
    twoFactorStatus,
    setTwoFactorStatus,
    banner,
  };

  return token ? (
    <Outlet context={outletContext} />
  ) : (
    <Navigate to="/sign-in" replace state={{ from: location, ...redirectState }} />
  );
}
