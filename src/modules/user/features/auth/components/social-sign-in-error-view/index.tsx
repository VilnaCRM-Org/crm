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

export default function SocialSignInErrorView({
  kind,
  providerLabel,
  onRetry,
}: SocialSignInErrorViewProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLElement>();
  const { messageKey, retryable } = ERROR_ROWS[kind];
  const showRetry = retryable && onRetry !== undefined;
  const [announcedMessage, setAnnouncedMessage] = useState('');

  useEffect(() => {
    setAnnouncedMessage(t(messageKey, { provider: providerLabel }));
  }, [messageKey, providerLabel, t]);

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
      <Box role="status" aria-live="polite">
        <UITypography sx={recoveryStyles.resultBody}>{announcedMessage}</UITypography>
      </Box>
      <Box sx={styles.actions}>
        {showRetry && (
          <UIButton variant="contained" onClick={onRetry} sx={recoveryStyles.resultAction}>
            {t('auth.social.try_again')}
          </UIButton>
        )}
        <InCardLink
          to={ROUTE_PATHS.signIn}
          variant={showRetry ? 'text' : 'contained'}
          sx={showRetry ? styles.backText : recoveryStyles.resultAction}
        >
          {t('auth.social.back_to_sign_in')}
        </InCardLink>
      </Box>
    </>
  );
}
