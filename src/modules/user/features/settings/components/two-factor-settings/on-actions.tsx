import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';

import useOptionalFocus from '../../hooks/use-optional-focus';
import type { OnActionsProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function OnActions({
  onDisable,
  onRegenerate,
  returnTo,
}: OnActionsProps): JSX.Element {
  const { t } = useTranslation();
  const focusDisable = useOptionalFocus<HTMLButtonElement>(returnTo === 'disable');
  const focusRegenerate = useOptionalFocus<HTMLButtonElement>(returnTo === 'regenerate');

  return (
    <Box sx={styles.actions}>
      <UIButton
        ref={focusDisable}
        type="button"
        variant="outlined"
        onClick={onDisable}
        sx={styles.actionButton}
      >
        {t('settings.two_factor.on.disable')}
      </UIButton>
      <UIButton
        ref={focusRegenerate}
        type="button"
        variant="outlined"
        onClick={onRegenerate}
        sx={styles.actionButton}
      >
        {t('settings.two_factor.on.regenerate')}
      </UIButton>
    </Box>
  );
}
