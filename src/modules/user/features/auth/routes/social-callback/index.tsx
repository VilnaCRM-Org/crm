import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import RouteFallback from '@/components/route-fallback';
import formStyles from '@/components/ui-form/styles';
import UITypography from '@/components/ui-typography';
import AuthCard from '@auth/components/auth-card';
import AuthPageLayout from '@auth/components/auth-page-layout';
import recoveryStyles from '@auth/components/reset-password/styles';
import SocialSignInErrorView from '@auth/components/social-sign-in-error-view';
import usePageTitle from '@auth/hooks/use-page-title';
import useSocialCallback from '@auth/hooks/use-social-callback';

function SocialCallbackContent(): JSX.Element {
  const { t } = useTranslation();
  const { view, retry } = useSocialCallback();

  if (view.status !== 'failed') {
    const message = t('auth.social.signing_in', { provider: view.label });
    // A visible, unfocused heading while the relay runs; the error view's h1 takes focus later.
    return (
      <>
        <UITypography component="h1" sx={[formStyles.formTitle, recoveryStyles.resultTitle]}>
          {message}
        </UITypography>
        <RouteFallback minHeight="12rem" message={message} />
      </>
    );
  }
  const label = view.label === '' ? t('auth.social.provider_fallback') : view.label;
  return <SocialSignInErrorView kind={view.error} providerLabel={label} onRetry={retry} />;
}

// Keyed by the history entry, so a retry (a fresh entry on the same route) starts over.
export default function SocialCallback(): JSX.Element {
  usePageTitle('auth.social.callback_title');
  const { key } = useLocation();

  return (
    <AuthPageLayout>
      <AuthCard variant="recovery">
        <SocialCallbackContent key={key} />
      </AuthCard>
    </AuthPageLayout>
  );
}
