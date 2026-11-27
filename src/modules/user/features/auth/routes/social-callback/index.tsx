import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import socialLinkStateGuard from '@/modules/user/lib/social-link/social-link-state-guard';
import AuthCard from '@auth/components/auth-card';
import AuthPageLayout from '@auth/components/auth-page-layout';
import SocialLinkReturnView from '@auth/components/social-link-return-view';
import SocialSignInErrorView from '@auth/components/social-sign-in-error-view';
import SocialSignInPendingView from '@auth/components/social-sign-in-pending-view';
import usePageTitle from '@auth/hooks/use-page-title';
import useSocialCallback from '@auth/hooks/use-social-callback';
import useSocialLinkReturn from '@auth/hooks/use-social-link-return';
import type { SocialLinkReturnProps } from '@auth/types/social-sign-in/social-link-return';
import socialCallbackViewMapper from '@auth/utils/social-callback-view-mapper';

function SocialCallbackContent(): JSX.Element {
  const { t } = useTranslation();
  const { view, retry } = useSocialCallback();

  if (view.status !== 'failed') return <SocialSignInPendingView providerLabel={view.label} />;
  const label = view.label === '' ? t('auth.social.provider_fallback') : view.label;
  return <SocialSignInErrorView kind={view.error} providerLabel={label} onRetry={retry} />;
}

function SocialLinkReturn({ query }: SocialLinkReturnProps): JSX.Element {
  useSocialLinkReturn(query);

  return <SocialLinkReturnView />;
}

function SocialCallbackFlow(): JSX.Element {
  const [query] = useState(() => socialCallbackViewMapper.readQuery());
  const linking = socialLinkStateGuard.isLinkState(query.state);
  usePageTitle(linking ? 'auth.social.link_title' : 'auth.social.callback_title');

  return linking ? <SocialLinkReturn query={query} /> : <SocialCallbackContent />;
}

// Keyed by the history entry, so a retry (a fresh entry on the same route) starts over.
export default function SocialCallback(): JSX.Element {
  const { key } = useLocation();

  return (
    <AuthPageLayout>
      <AuthCard variant="recovery">
        <SocialCallbackFlow key={key} />
      </AuthCard>
    </AuthPageLayout>
  );
}
