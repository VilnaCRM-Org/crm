import { useTranslation } from 'react-i18next';
import { useLinkClickHandler } from 'react-router-dom';

import UIButton from '@/components/ui-button';
import type { AuthSwitcherProps } from '@auth/types/auth-switcher';

import styles from './styles';

export default function AuthSwitcher({ to, labelKey }: AuthSwitcherProps): JSX.Element {
  const { t } = useTranslation();
  const handleClick = useLinkClickHandler<HTMLButtonElement>(to);

  return (
    <UIButton to={to} onClick={handleClick} disableRipple sx={styles.switcher}>
      {t(labelKey)}
    </UIButton>
  );
}
