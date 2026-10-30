import { type JSX, lazy, useEffect, useState } from 'react';
import { Navigate } from 'react-router';

import useOnceCallback from '@/hooks/use-once-callback';
import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import ROUTE_PATHS from '@/routes/route-paths';
import RecoveryPageLayout from '@auth/components/recovery-page-layout';
import usePostLoginRedirect from '@auth/hooks/use-post-login-redirect';
import en from '@auth/routes/two-factor-catalog/i18n/en.json';
import uk from '@auth/routes/two-factor-catalog/i18n/uk.json';
import useAuthStore from '@auth/stores/use-auth-store';

import twoFactorFormSectionLoader from './form-section-loader';

lazyCatalogLoader.register(i18n, { en, uk });

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
