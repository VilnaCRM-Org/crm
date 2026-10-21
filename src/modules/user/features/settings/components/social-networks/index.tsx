import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import { type JSX, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as Facebook } from '@/assets/icons/social/facebook-color.svg';
import { ReactComponent as GitHub } from '@/assets/icons/social/github-color.svg';
import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { ReactComponent as Twitter } from '@/assets/icons/social/twitter-color.svg';
import UITypography from '@/components/ui-typography';

import type { SocialTileProps } from '../../types/components/social-networks';

import styles from './styles';

function SocialTile({ label, Icon, status }: SocialTileProps): JSX.Element {
  return (
    <Box component="li" sx={styles.tile}>
      <SvgIcon component={Icon} inheritViewBox sx={styles.icon} />
      <Box component="span" sx={styles.label}>
        {label}
        <Box component="span" sx={styles.status}>
          {status}
        </Box>
      </Box>
    </Box>
  );
}

export default function SocialNetworks(): JSX.Element {
  const { t } = useTranslation();
  const headingId = useId();
  const providers = [
    { label: 'Google', Icon: Google },
    { label: 'Facebook', Icon: Facebook },
    { label: 'GitHub', Icon: GitHub },
    { label: 'Twitter', Icon: Twitter },
  ];
  const status = t('settings.social.linking_unavailable');

  return (
    <Box sx={styles.card}>
      <UITypography component="h2" id={headingId} sx={styles.heading}>
        {t('settings.social.heading')}
      </UITypography>
      <Box component="ul" role="list" aria-labelledby={headingId} sx={styles.list}>
        {providers.map(({ label, Icon }) => (
          <SocialTile key={label} label={label} Icon={Icon} status={status} />
        ))}
      </Box>
    </Box>
  );
}
