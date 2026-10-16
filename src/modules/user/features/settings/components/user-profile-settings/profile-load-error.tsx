import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { ProfileLoadErrorProps } from '../../types/components/user-profile-settings';

import styles from './styles';

export default function ProfileLoadError({ onRetry, focus }: ProfileLoadErrorProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLButtonElement>();

  return (
    <Box role="alert" sx={styles.error}>
      <Box component="p" sx={styles.errorMessage}>
        {t('settings.profile.load_failed')}
      </Box>
      <UIButton ref={focus ? focusOnMount : undefined} onClick={onRetry}>
        {t('auth.error.tryAgain')}
      </UIButton>
    </Box>
  );
}
