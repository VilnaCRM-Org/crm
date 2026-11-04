import Box from '@mui/material/Box';
import { type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as InfoIcon } from '../../assets/info-circle.svg';
import useKeyInfoTooltip from '../../hooks/use-key-info-tooltip';

import KeyInfoBubble from './key-info-bubble';
import styles from './key-info-styles';

export default function KeyInfoTooltip(): JSX.Element {
  const { t } = useTranslation();
  const tooltipId = useId();
  const { open, anchorRef, handlers } = useKeyInfoTooltip();

  return (
    <Box
      ref={anchorRef}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
      onClick={handlers.onClick}
      sx={styles.anchor}
    >
      <Box
        component="button"
        type="button"
        aria-label={t('settings.two_factor.setup.key_info_label')}
        aria-describedby={tooltipId}
        sx={styles.button}
      >
        <Box component={InfoIcon} aria-hidden="true" focusable="false" sx={styles.icon} />
      </Box>
      <KeyInfoBubble id={tooltipId} open={open} text={t('settings.two_factor.setup.key_info')} />
    </Box>
  );
}
