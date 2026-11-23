import type { RefObject } from 'react';

import type { ToastTone } from '@/components/types/ui-toast';
import type {
  SocialLinkProviderId,
  SocialLinkWindow,
} from '@/modules/user/types/social-link/social-link-callback';

import type { SocialLinkProvider } from '../../data-providers';

import type { LinkedProviderSet, SocialLinkChangeOutcome } from './outcome';

export type SocialLinkIntent = 'linked' | 'unlinked';

export interface SocialLinkTarget {
  readonly id: SocialLinkProviderId;
  readonly label: string;
  readonly controlRef: RefObject<HTMLElement | null>;
}

export type SocialLinkAction = (target: SocialLinkTarget) => Promise<void>;

export type SocialLinksStatus = 'loading' | 'ready' | 'failed' | 'retrying';

export interface SocialLinksState {
  readonly status: SocialLinksStatus;
  readonly linked: LinkedProviderSet;
  readonly reload: boolean;
}

export interface SocialLinksLoaded {
  readonly type: 'loaded';
  readonly linked: LinkedProviderSet;
}

export interface SocialLinksTransition {
  readonly type: 'failed' | 'retry';
}

export interface SocialLinksChanged {
  readonly type: 'changed';
  readonly id: SocialLinkProviderId;
  readonly intent: SocialLinkIntent;
}

export type SocialLinksAction = SocialLinksLoaded | SocialLinksTransition | SocialLinksChanged;

export interface SocialLinks {
  readonly status: SocialLinksStatus;
  readonly linked: LinkedProviderSet;
  readonly busy: boolean;
  readonly link: SocialLinkAction;
  readonly unlink: SocialLinkAction;
  readonly retry: () => void;
}

export type SocialLinkStep = (target: SocialLinkTarget) => void;

export interface UnlinkRequest {
  readonly target: SocialLinkTarget | null;
  readonly count: number;
}

export type UnlinkRequestSetter = (request: UnlinkRequest) => void;

export interface UnlinkContext {
  readonly links: SocialLinks;
  readonly request: UnlinkRequest;
  readonly setRequest: UnlinkRequestSetter;
}

export interface UnlinkConfirmation {
  readonly request: UnlinkRequest;
  readonly ask: SocialLinkStep;
  readonly link: SocialLinkStep;
  readonly cancel: SocialLinkStep;
  readonly confirm: SocialLinkStep;
}

export interface SocialLinkSettlement {
  readonly target: SocialLinkTarget;
  readonly intent: SocialLinkIntent;
  readonly outcome: SocialLinkChangeOutcome;
}

export type SocialLinkSettle = (settlement: SocialLinkSettlement) => void;

export type SocialLinkAdopt = (id: SocialLinkProviderId, intent: SocialLinkIntent) => void;

export type SocialLinkShow = (tone: ToastTone, key: string) => void;

export interface SocialBusy {
  readonly busy: boolean;
  readonly hold: <TOutcome>(work: Promise<TOutcome>) => Promise<TOutcome>;
  readonly isHeld: () => boolean;
}

export interface SocialLinkDeps {
  readonly provider: SocialLinkProvider;
  readonly settle: SocialLinkSettle;
  readonly busy: SocialBusy;
}

export interface SocialLinkFlight {
  readonly controller: AbortController;
  readonly popup: SocialLinkWindow;
}

export interface SocialLinkRun {
  readonly deps: SocialLinkDeps;
  readonly id: SocialLinkProviderId;
  readonly flight: SocialLinkFlight;
}
