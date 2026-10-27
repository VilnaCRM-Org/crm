import { useTranslation } from 'react-i18next';

import type { UIFormErrorAction } from '@/components/types/ui-form';
import type { TwoFactorBannerCode } from '@/modules/user/types/two-factor/code';

import type { TwoFactorBanner } from '../types/hooks/two-factor-banner';

const BANNER_KEYS = new Map<TwoFactorBannerCode, string>([
  ['rate_limited', 'settings.two_factor.banner.rate_limited'],
  ['transient', 'settings.two_factor.banner.transient'],
]);

export default function useTwoFactorBanner(
  banner: TwoFactorBannerCode | null,
  retry: () => void
): TwoFactorBanner {
  const { t } = useTranslation();
  const key = banner === null ? undefined : BANNER_KEYS.get(banner);
  const action: UIFormErrorAction | undefined =
    banner === 'transient' ? { label: t('auth.error.tryAgain'), onClick: retry } : undefined;
  return { error: key === undefined ? null : t(key), action };
}
