import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UnlinkIcon } from '../../assets/trash-04.svg';
import useTileFocus from '../../hooks/use-tile-focus';
import type {
  SocialInertTileProps,
  SocialTileControlProps,
  SocialTileLabelProps,
  SocialTileProps,
} from '../../types/components/social-networks';

import styles from './styles';

function TileLabel({ tile, status }: SocialTileLabelProps): JSX.Element {
  return (
    <>
      <SvgIcon component={tile.Icon} inheritViewBox sx={styles.icon} />
      <Box component="span" sx={styles.label}>
        {tile.label}
        <Box component="span" sx={styles.status}>
          {status}
        </Box>
      </Box>
    </>
  );
}

function LinkControl({ tile, busy, controlRef, onActivate }: SocialTileControlProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box
      component="button"
      type="button"
      ref={controlRef}
      aria-label={t('settings.social.link', { provider: tile.label })}
      aria-disabled={busy}
      sx={[styles.tile, styles.link]}
      onClick={onActivate}
    >
      <TileLabel tile={tile} />
    </Box>
  );
}

function LinkedTile({ tile, busy, controlRef, onActivate }: SocialTileControlProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box sx={[styles.tile, styles.linked]}>
      <TileLabel tile={tile} status={t('settings.social.linked_status')} />
      <Box
        component="button"
        type="button"
        ref={controlRef}
        aria-label={t('settings.social.unlink', { provider: tile.label })}
        aria-disabled={busy}
        sx={styles.unlink}
        onClick={onActivate}
      >
        <SvgIcon component={UnlinkIcon} inheritViewBox sx={styles.unlinkIcon} />
      </Box>
    </Box>
  );
}

export function SocialInertTile({ tile }: SocialInertTileProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Box component="li" sx={[styles.item, styles.tile]}>
      <TileLabel tile={tile} status={t('settings.social.linking_unavailable')} />
    </Box>
  );
}

export default function SocialTile({
  tile,
  linked,
  busy,
  onLink,
  onUnlink,
}: SocialTileProps): JSX.Element {
  const { controlRef, attach } = useTileFocus(linked);
  const act = linked ? onUnlink : onLink;
  const activate = (): void => {
    controlRef.current?.focus();
    act({ id: tile.id, label: tile.label, controlRef });
  };
  const Control = linked ? LinkedTile : LinkControl;

  return (
    <Box component="li" sx={styles.item}>
      <Control tile={tile} busy={busy} controlRef={attach} onActivate={activate} />
    </Box>
  );
}
