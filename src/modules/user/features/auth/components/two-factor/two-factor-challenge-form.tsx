import { Box } from '@mui/material';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import type { TwoFactorBannerCode } from '@/modules/user/types/two-factor/code';
import type { TwoFactorDto } from '@/modules/user/types/user/two-factor-dto';
import useFocusOnMount from '@/utils/use-focus-on-mount';
import type { TwoFactorChallengeProps } from '@auth/types/two-factor/challenge-view';

import ChallengeCodeField from './challenge-code-field';
import styles from './styles';

const DEFAULT_VALUES: TwoFactorDto = { twoFactorCode: '' };

const BANNER_KEYS: Record<TwoFactorBannerCode, string> = {
  rate_limited: 'two_factor.banner.rate_limited',
  transient: 'two_factor.banner.transient',
};

export default function TwoFactorChallengeForm({
  state,
  callbacks,
}: TwoFactorChallengeProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLElement>();
  const { banner } = state;

  return (
    <UIForm<TwoFactorDto>
      onSubmit={callbacks.submit}
      defaultValues={DEFAULT_VALUES}
      error={banner === null ? null : t(BANNER_KEYS[banner])}
      errorAction={
        banner === 'transient'
          ? { label: t('auth.error.tryAgain'), onClick: callbacks.retry }
          : undefined
      }
      isSubmitting={state.isSubmitting}
      submitLabel={t('two_factor.submit_button')}
      submittingLabel={t('two_factor.submitting')}
      title={t('two_factor.title')}
      titleComponent="h1"
      titleRef={focusOnMount}
      subtitle={t('two_factor.subtitle')}
      notice={
        <Box component="p" sx={styles.note}>
          {t('two_factor.note')}
        </Box>
      }
    >
      <ChallengeCodeField state={state} />
    </UIForm>
  );
}
