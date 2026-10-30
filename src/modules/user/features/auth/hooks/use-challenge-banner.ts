import { useTranslation } from 'react-i18next';

import type { UIFormErrorAction } from '@/components/types/ui-form';
import type { TwoFactorBannerCode } from '@/modules/user/types/two-factor/code';
import type { ChallengeBannerProps } from '@auth/types/two-factor/challenge-components';

const BANNER_KEYS: Record<TwoFactorBannerCode, string> = {
  rate_limited: 'two_factor.banner.rate_limited',
  transient: 'two_factor.banner.transient',
};

export default function useChallengeBanner(
  banner: TwoFactorBannerCode | null,
  retry: () => void
): ChallengeBannerProps {
  const { t } = useTranslation();
  const action: UIFormErrorAction | undefined =
    banner === 'transient' ? { label: t('auth.error.tryAgain'), onClick: retry } : undefined;
  return { error: banner === null ? null : t(BANNER_KEYS[banner]), action };
}
