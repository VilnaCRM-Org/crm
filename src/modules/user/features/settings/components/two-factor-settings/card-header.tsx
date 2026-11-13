import Box from '@mui/material/Box';
import { type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import UITypography from '@/components/ui-typography';

import { ReactComponent as AuthenticatorLogo } from '../../assets/authenticator-logo.svg';
import useOptionalFocus from '../../hooks/use-optional-focus';
import type { CardHeaderProps } from '../../types/components/two-factor-settings';

import styles from './card-header-styles';

export default function CardHeader({ title, focus, divided }: CardHeaderProps): JSX.Element {
  const { t } = useTranslation();
  const subtitleId = useId();
  const focusOnMount = useOptionalFocus<HTMLElement>(focus);

  return (
    <Box sx={divided ? styles.divided : styles.plain}>
      <Box component={AuthenticatorLogo} aria-hidden="true" focusable="false" sx={styles.logo} />
      <Box sx={styles.text}>
        <UITypography
          component="h2"
          ref={focusOnMount}
          tabIndex={-1}
          aria-describedby={subtitleId}
          sx={styles.title}
        >
          {title}
        </UITypography>
        <UITypography id={subtitleId} sx={styles.subtitle}>
          {t('settings.two_factor.setup.subtitle')}
        </UITypography>
      </Box>
    </Box>
  );
}
