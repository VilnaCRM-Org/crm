import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIButton from '@/components/ui-button';
import { ReactComponent as ChevronLeft } from '@auth/assets/chevron-left.svg';
import type { CardBackControlProps } from '@auth/types/password-recovery/components';

import InCardLink from './in-card-link';
import styles from './styles';

export default function CardBackControl(props: CardBackControlProps): JSX.Element {
  const { t } = useTranslation();
  const content = (
    <>
      <ChevronLeft aria-hidden="true" focusable="false" />
      {t('password_recovery.back')}
    </>
  );

  if (props.to !== undefined) {
    return (
      <InCardLink to={props.to} variant="text" sx={styles.backControl}>
        {content}
      </InCardLink>
    );
  }
  return (
    <UIButton
      type="button"
      variant="text"
      onClick={props.onClick}
      disableRipple
      sx={styles.backControl}
    >
      {content}
    </UIButton>
  );
}
