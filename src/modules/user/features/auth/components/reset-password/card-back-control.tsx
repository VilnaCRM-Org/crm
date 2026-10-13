import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import { ReactComponent as ChevronLeft } from '@auth/assets/chevron-left.svg';
import type { CardBackControlProps } from '@auth/types/password-recovery/components';

import InCardLink from './in-card-link';
import styles from './styles';

export default function CardBackControl({ to, onClick }: CardBackControlProps): JSX.Element {
  const { t } = useTranslation();
  const content = (
    <>
      <ChevronLeft aria-hidden="true" focusable="false" />
      {t('password_recovery.back')}
    </>
  );

  if (to !== undefined) {
    return (
      <InCardLink to={to} variant="text" sx={styles.backControl}>
        {content}
      </InCardLink>
    );
  }
  return (
    <UIButton type="button" variant="text" onClick={onClick} disableRipple sx={styles.backControl}>
      {content}
    </UIButton>
  );
}
