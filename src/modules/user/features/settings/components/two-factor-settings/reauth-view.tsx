import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import useFocusOnMount from '@/utils/use-focus-on-mount';

import type { TwoFactorSettingsProps } from '../../types/two-factor/settings-view';

import styles from './styles';

export default function ReauthView({ callbacks }: TwoFactorSettingsProps): JSX.Element {
  const { t } = useTranslation();
  const focusOnMount = useFocusOnMount<HTMLElement>();

  return (
    <>
      <Box component="p" ref={focusOnMount} tabIndex={-1} sx={styles.reauthMessage}>
        {t('settings.two_factor.reauth.message')}
      </Box>
      <UIButton
        type="button"
        variant="outlined"
        onClick={callbacks.signInAgain}
        sx={styles.reauthButton}
      >
        {t('settings.two_factor.reauth.sign_in')}
      </UIButton>
    </>
  );
}
