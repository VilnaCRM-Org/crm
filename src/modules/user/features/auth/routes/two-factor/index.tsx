import { type JSX, lazy, useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import useOnceCallback from '@/hooks/use-once-callback';
import ROUTE_PATHS from '@/routes/route-paths';
import RecoveryPageLayout from '@auth/components/recovery-page-layout';
import usePostLoginRedirect from '@auth/hooks/use-post-login-redirect';
import useAuthStore from '@auth/stores/use-auth-store';

import twoFactorFormSectionLoader from './form-section-loader';

const TwoFactorFormSection = lazy(() => twoFactorFormSectionLoader.load());

function useProceedWhenSignedIn(): void {
  const { proceed, signedIn } = usePostLoginRedirect();
  const proceedOnce = useOnceCallback(proceed);

  useEffect(() => {
    if (signedIn) proceedOnce();
  }, [signedIn, proceedOnce]);
}

export default function TwoFactorChallenge(): JSX.Element | null {
  const pending = useAuthStore((state) => state.pendingSessionId !== null);
  const signedIn = useAuthStore((state) => state.token !== null);
  const [arrivedWithSession] = useState(pending);
  useProceedWhenSignedIn();

  if (pending) {
    return (
      <RecoveryPageLayout titleKey="two_factor.title">
        <TwoFactorFormSection />
      </RecoveryPageLayout>
    );
  }
  return arrivedWithSession && signedIn ? null : <Navigate to={ROUTE_PATHS.signIn} replace />;
}
