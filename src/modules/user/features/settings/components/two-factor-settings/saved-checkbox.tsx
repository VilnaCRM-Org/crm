import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UICheckbox from '@/components/ui-checkbox';

import type { SavedCheckboxProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function SavedCheckbox({ checked, onChange }: SavedCheckboxProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={styles.savedRow}>
      <UICheckbox
        label={t('settings.two_factor.codes.saved')}
        checked={checked}
        onChange={onChange}
      />
    </Box>
  );
}
