import { useTranslation } from 'react-i18next';

import type { TwoFactorCodeKind } from '@/modules/user/types/two-factor/code';
import type { ChallengeCopy } from '@auth/types/two-factor/challenge-components';

export default function useChallengeCopy(mode: TwoFactorCodeKind): ChallengeCopy {
  const { t } = useTranslation();

  return {
    title: t('two_factor.title'),
    subtitle: mode === 'totp' ? t('two_factor.subtitle') : t('two_factor.recovery.subtitle'),
    note: t('two_factor.note'),
    submitLabel: t('two_factor.submit_button'),
    submittingLabel: t('two_factor.submitting'),
  };
}
