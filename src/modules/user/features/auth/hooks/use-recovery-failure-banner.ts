import type { TFunction } from 'i18next';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { RecoveryFailure } from '@auth/types/password-recovery/outcome';
import type { RecoveryFailureBanner } from '@auth/types/password-recovery/state';

export const RECOVERY_BANNER_LIFETIME_MS = 5000;

function bannerText(failure: RecoveryFailure | null, t: TFunction): string | null {
  if (failure?.reason === 'rate_limited') return t('password_recovery.errors.rate_limited');
  if (failure?.retryable === true) return t('password_recovery.errors.transient');
  return null;
}

export default function useRecoveryFailureBanner(
  failure: RecoveryFailure | null,
  dismiss: () => void
): RecoveryFailureBanner {
  const { t } = useTranslation();
  const error = bannerText(failure, t);
  const shown = error !== null;
  const dismissRef = useRef(dismiss);
  useLayoutEffect(() => {
    dismissRef.current = dismiss;
  });

  useEffect(() => {
    if (!shown) return undefined;
    const timer = window.setTimeout(() => dismissRef.current(), RECOVERY_BANNER_LIFETIME_MS);
    return (): void => window.clearTimeout(timer);
  }, [shown, failure]);

  return { error, retry: failure?.retryable === true };
}
