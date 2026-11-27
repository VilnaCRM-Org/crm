import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIStatusBadge from '@/components/ui-status-badge';

import { ReactComponent as UnlinkIcon } from '../../assets/trash-04.svg';
import type { SocialTileControlProps } from '../../types/components/social-networks';

import TileLabel from './social-tile-label';
import styles from './styles';
import variantStyles from './variant-styles';

export default function BadgeLinkedTile({
  tile,
  busy,
  controlRef,
  onActivate,
}: SocialTileControlProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={[styles.tile, variantStyles.linkedBadge]}>
      <TileLabel tile={tile} status={t('settings.social.linked_status')} />
      <Box component="span" aria-hidden="true" sx={variantStyles.badgeSlot}>
        <UIStatusBadge label={t('settings.social.linked_badge')} active sx={variantStyles.badge} />
      </Box>
      <Box
        component="button"
        type="button"
        ref={controlRef}
        aria-label={t('settings.social.unlink', { provider: tile.label })}
        aria-disabled={busy}
        sx={variantStyles.unlinkDanger}
        onClick={onActivate}
      >
        <SvgIcon component={UnlinkIcon} inheritViewBox sx={styles.unlinkIcon} />
      </Box>
    </Box>
  );
}
