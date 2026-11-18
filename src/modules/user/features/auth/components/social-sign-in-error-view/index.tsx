import { Box } from '@mui/material';
import { type JSX, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import formStyles from '@/components/ui-form/styles';
import UITypography from '@/components/ui-typography';
import ROUTE_PATHS from '@/routes/route-paths';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import InCardLink from '@auth/components/reset-password/in-card-link';
import recoveryStyles from '@auth/components/reset-password/styles';
import type {
  SocialSignInErrorActionsProps,
  SocialSignInErrorMessageProps,
  SocialSignInErrorTable,
  SocialSignInErrorViewProps,
} from '@auth/types/social-sign-in/social-sign-in-error-view';

import styles from './styles';

const ERROR_ROWS: SocialSignInErrorTable = {
  cancelled: { messageKey: 'auth.social.error.cancelled', retryable: true },
  missing_parameters: { messageKey: 'auth.social.error.missing_parameters', retryable: true },
  provider_mismatch: { messageKey: 'auth.social.error.provider_mismatch', retryable: false },
  unsupported_provider: { messageKey: 'auth.social.error.unsupported_provider', retryable: false },
  duplicate_email: { messageKey: 'auth.social.error.duplicate_email', retryable: false },
  expired: { messageKey: 'auth.social.error.expired', retryable: true },
  email_unavailable: { messageKey: 'auth.social.error.email_unavailable', retryable: true },
  email_unverified: { messageKey: 'auth.social.error.email_unverified', retryable: true },
  unavailable: { messageKey: 'auth.social.error.unavailable', retryable: true },
  two_factor_required: { messageKey: 'auth.social.error.two_factor_required', retryable: false },
  generic: { messageKey: 'auth.social.error.generic', retryable: true },
};

// Mounted empty and filled after the first paint, so the polite region announces the reason
// after the focused heading instead of being created and filled in one commit.
function SocialSignInErrorMessage({
  messageKey,
  providerLabel,
}: SocialSignInErrorMessageProps): JSX.Element {
  const { t } = useTranslation();
  const [announcedMessage, setAnnouncedMessage] = useState('');

  useEffect(() => {
    setAnnouncedMessage(t(messageKey, { provider: providerLabel }));
  }, [messageKey, providerLabel, t]);

  return (
    <Box role="status" aria-live="polite">
      <UITypography sx={recoveryStyles.resultBody}>{announcedMessage}</UITypography>
    </Box>
  );
}

function SocialSignInErrorActions({ onRetry }: SocialSignInErrorActionsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box id="social-sign-in-actions" sx={styles.actions}>
      {onRetry !== undefined && (
        <UIButton variant="contained" onClick={onRetry} sx={recoveryStyles.resultAction}>
          {t('auth.social.try_again')}
        </UIButton>
      )}
      <InCardLink
        to={ROUTE_PATHS.signIn}
        variant={onRetry === undefined ? 'contained' : 'text'}
        sx={onRetry === undefined ? recoveryStyles.resultAction : styles.backText}
      >
        {t('auth.social.back_to_sign_in')}
      </InCardLink>
    </Box>
  );
}

export default function SocialSignInErrorView({
  kind,
  providerLabel,
  onRetry,
}: SocialSignInErrorViewProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLElement>();
  const { messageKey, retryable } = ERROR_ROWS[kind];

  return (
    <>
      <UITypography
        component="h1"
        ref={focusOnMount}
        tabIndex={-1}
        sx={[formStyles.formTitle, recoveryStyles.resultTitle]}
      >
        {t('auth.social.error.title', { provider: providerLabel })}
      </UITypography>
      <SocialSignInErrorMessage messageKey={messageKey} providerLabel={providerLabel} />
      <SocialSignInErrorActions onRetry={retryable ? onRetry : undefined} />
    </>
  );
}
