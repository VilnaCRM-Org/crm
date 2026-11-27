import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIOutlinedSmallButton from '@/components/ui-outlined-small-button';

import { ReactComponent as UnlinkIcon } from '../../assets/trash-04.svg';
import type { SocialTileControlProps } from '../../types/components/social-networks';

import TileLabel from './social-tile-label';
import styles from './styles';
import variantStyles from './variant-styles';

export default function LabelledLinkedTile({
  tile,
  busy,
  controlRef,
  onActivate,
}: SocialTileControlProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={[styles.tile, variantStyles.linkedLabelled]}>
      <TileLabel tile={tile} status={t('settings.social.linked_status')} />
      <UIOutlinedSmallButton
        ref={controlRef}
        aria-label={t('settings.social.unlink', { provider: tile.label })}
        aria-disabled={busy}
        sx={variantStyles.unlinkPill}
        onClick={onActivate}
      >
        <SvgIcon
          component={UnlinkIcon}
          inheritViewBox
          sx={[styles.unlinkIcon, variantStyles.pillIcon]}
        />
        <Box component="span" sx={variantStyles.pillText}>
          {t('settings.social.unlink_confirm')}
        </Box>
      </UIOutlinedSmallButton>
    </Box>
  );
}
