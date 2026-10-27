import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';

import type { CancelButtonProps } from '../../types/components/two-factor-settings';

import styles from './styles';

export default function CancelButton({ onCancel }: CancelButtonProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <UIButton type="button" variant="outlined" onClick={onCancel} sx={styles.footerButton}>
      {t('settings.two_factor.cancel')}
    </UIButton>
  );
}
