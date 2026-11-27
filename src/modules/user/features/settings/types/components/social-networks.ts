import type { ComponentType, Ref, RefObject, SVGProps } from 'react';

import type { SocialLinkProviderId } from '@/modules/user/types/social-link/social-link-callback';

import type {
  SocialLinkFocusReturn,
  SocialLinks,
  SocialLinksStatus,
  SocialLinkStep,
  UnlinkConfirmation,
} from '../social-link/social-links';

import type { SocialTileStyle } from './social-tile-style';

export interface SocialListProps {
  readonly links: SocialLinks;
  readonly confirmation: UnlinkConfirmation;
  readonly headingId: string;
  readonly tileStyle: SocialTileStyle;
}

export interface SocialNetworksProps {
  readonly returnFocusRef: SocialLinkFocusReturn;
  readonly tileStyle?: SocialTileStyle;
}

export interface SocialNetworksCardProps {
  readonly links: SocialLinks;
  readonly tileStyle: SocialTileStyle;
}

export interface SocialTileProvider {
  readonly id: SocialLinkProviderId;
  readonly label: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface SocialTileProps {
  readonly tile: SocialTileProvider;
  readonly linked: boolean;
  readonly busy: boolean;
  readonly tileStyle: SocialTileStyle;
  readonly onLink: SocialLinkStep;
  readonly onUnlink: SocialLinkStep;
}

export interface SocialTileLabelProps {
  readonly tile: SocialTileProvider;
  readonly status?: string | undefined;
}

export interface SocialTileControlProps {
  readonly tile: SocialTileProvider;
  readonly busy: boolean;
  readonly controlRef: Ref<HTMLButtonElement>;
  readonly onActivate: () => void;
}

export interface LinkedTileRenderers {
  readonly tinted: ComponentType<SocialTileControlProps>;
  readonly badge: ComponentType<SocialTileControlProps>;
  readonly labelled: ComponentType<SocialTileControlProps>;
}

export interface SocialInertTileProps {
  readonly tile: SocialTileProvider;
}

export interface SocialLoadFailureProps {
  readonly retrying: boolean;
  readonly headingRef: RefObject<HTMLElement | null>;
  readonly onRetry: () => void;
}

export interface SocialUnlinkRowProps {
  readonly confirmation: UnlinkConfirmation;
  readonly busy: boolean;
}

export interface SocialUnlinkConfirmationProps {
  readonly label: string;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export interface SocialUnlinkActionsProps {
  readonly questionId: string;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export interface SocialLoadStatusProps {
  readonly status: SocialLinksStatus;
}

export interface TileControlBox {
  current: HTMLButtonElement | null;
}

export interface TileFocus {
  readonly controlRef: TileControlBox;
  readonly attach: (node: HTMLButtonElement | null) => () => void;
}
