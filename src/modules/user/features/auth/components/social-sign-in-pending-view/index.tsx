import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import RouteFallback from '@/components/route-fallback';
import formStyles from '@/components/ui-form/styles';
import UITypography from '@/components/ui-typography';
import recoveryStyles from '@auth/components/reset-password/styles';
import type { SocialSignInPendingViewProps } from '@auth/types/social-sign-in/pending-view';

// What the social callback page shows while a mutation runs: a visible heading that does not take
// focus (the error view's heading takes it if the attempt fails) and the deferred, politely
// announced spinner every route shows while it loads.
export default function SocialSignInPendingView({
  providerLabel,
}: SocialSignInPendingViewProps): JSX.Element {
  const { t } = useTranslation();
  const message = t('auth.social.signing_in', { provider: providerLabel });

  return (
    <>
      <UITypography component="h1" sx={[formStyles.formTitle, recoveryStyles.resultTitle]}>
        {message}
      </UITypography>
      <RouteFallback minHeight="12rem" message={message} />
    </>
  );
}
