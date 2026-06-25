import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import type { AuthSwitcherProps } from '@auth/types/auth-switcher';

import styles from './styles';

export default function AuthSwitcher({ to, labelKey }: AuthSwitcherProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <UIButton to={to} disableRipple sx={styles.switcher}>
      {t(labelKey)}
    </UIButton>
  );
}
