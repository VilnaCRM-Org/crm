import Box from '@mui/material/Box';
import { type JSX, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as Facebook } from '@/assets/icons/social/facebook-color.svg';
import { ReactComponent as GitHub } from '@/assets/icons/social/github-color.svg';
import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { ReactComponent as Twitter } from '@/assets/icons/social/twitter-color.svg';
import UILiveStatus from '@/components/ui-live-status';
import UITypography from '@/components/ui-typography';

import useSocialLinks from '../../hooks/use-social-links';
import useUnlinkConfirmation from '../../hooks/use-unlink-confirmation';
import type {
  SocialListProps,
  SocialLoadStatusProps,
  SocialNetworksCardProps,
  SocialNetworksProps,
  SocialTileProvider,
  SocialUnlinkRowProps,
} from '../../types/components/social-networks';

import SocialLoadFailure from './social-load-failure';
import SocialTile, { SocialInertTile } from './social-tile';
import SocialUnlinkConfirmation from './social-unlink-confirmation';
import styles from './styles';

const PROVIDERS: readonly SocialTileProvider[] = [
  { id: 'google', label: 'Google', Icon: Google },
  { id: 'facebook', label: 'Facebook', Icon: Facebook },
  { id: 'github', label: 'GitHub', Icon: GitHub },
  { id: 'twitter', label: 'Twitter', Icon: Twitter },
];

function SocialLoadStatus({ status }: SocialLoadStatusProps): JSX.Element {
  const { t } = useTranslation();
  const text = {
    loading: '',
    ready: '',
    failed: t('settings.social.load_failed'),
    retrying: t('settings.social.loading'),
  };

  return <UILiveStatus message={text[status]} />;
}

function SocialList({ links, confirmation, headingId }: SocialListProps): JSX.Element {
  const { status, linked, busy } = links;

  return (
    <Box component="ul" role="list" aria-labelledby={headingId} sx={styles.list}>
      {PROVIDERS.map((tile) =>
        status === 'ready' ? (
          <SocialTile
            key={tile.id}
            tile={tile}
            linked={linked.items.includes(tile.id)}
            busy={busy}
            onLink={confirmation.link}
            onUnlink={confirmation.ask}
          />
        ) : (
          <SocialInertTile key={tile.id} tile={tile} />
        )
      )}
    </Box>
  );
}

function SocialUnlinkRow({ confirmation, busy }: SocialUnlinkRowProps): JSX.Element | null {
  const { request, cancel, confirm } = confirmation;
  const { target, count } = request;
  if (target === null) return null;

  return (
    <SocialUnlinkConfirmation
      key={count}
      label={target.label}
      busy={busy}
      onCancel={() => cancel(target)}
      onConfirm={() => confirm(target)}
    />
  );
}

export function SocialNetworksCard({ links }: SocialNetworksCardProps): JSX.Element {
  const { t } = useTranslation();
  const headingId = useId();
  const headingRef = useRef<HTMLElement>(null);
  const confirmation = useUnlinkConfirmation(links);
  const { status, retry } = links;
  const retrying = status === 'retrying';

  return (
    <Box sx={styles.card}>
      <UITypography
        component="h2"
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        sx={styles.heading}
      >
        {t('settings.social.heading')}
      </UITypography>
      <SocialList links={links} confirmation={confirmation} headingId={headingId} />
      <SocialUnlinkRow confirmation={confirmation} busy={links.busy} />
      <SocialLoadStatus status={status} />
      {(retrying || status === 'failed') && (
        <SocialLoadFailure retrying={retrying} headingRef={headingRef} onRetry={retry} />
      )}
    </Box>
  );
}

export default function SocialNetworks({ toasts }: SocialNetworksProps): JSX.Element {
  return <SocialNetworksCard links={useSocialLinks(toasts)} />;
}
