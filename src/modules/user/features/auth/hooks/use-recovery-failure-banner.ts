import { useTranslation } from 'react-i18next';

import type { RecoveryFailure } from '@auth/types/password-recovery/outcome';
import type { RecoveryFailureBanner } from '@auth/types/password-recovery/state';

const NO_BANNER: RecoveryFailureBanner = { error: null };

export default function useRecoveryFailureBanner(
  failure: RecoveryFailure | null,
  retry: () => Promise<void>
): RecoveryFailureBanner {
  const { t } = useTranslation();

  if (failure?.reason === 'rate_limited') {
    return { error: t('password_recovery.errors.rate_limited') };
  }
  if (failure?.retryable !== true) return NO_BANNER;
  return {
    error: t('password_recovery.errors.transient'),
    errorAction: { label: t('auth.error.tryAgain'), onClick: retry },
  };
}
