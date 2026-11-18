import type { RedirectNavigationState } from '@/routes/types/navigation-state';

import type { SocialProvider } from './social-provider';
import type { SocialSignInErrorKind } from './social-sign-in-error-kind';
import type { SocialCallbackParams } from './social-sign-in-outcome';

export interface SocialCallbackQuery {
  readonly code: string | null;
  readonly state: string | null;
  readonly error: string | null;
}

export interface SocialRelayingView {
  readonly status: 'relaying';
  readonly provider: SocialProvider;
  readonly label: string;
}

export interface SocialFailedView {
  readonly status: 'failed';
  readonly provider: SocialProvider | null;
  readonly label: string;
  readonly error: SocialSignInErrorKind;
}

export interface SocialRedirectView {
  readonly status: 'redirect';
  readonly to: string;
  readonly state: RedirectNavigationState;
}

export type SocialCallbackView = SocialRelayingView | SocialFailedView | SocialRedirectView;

export interface SocialCallback {
  readonly view: SocialCallbackView;
  readonly retry: (() => void) | undefined;
}

export interface SocialRelay {
  readonly view: SocialRelayingView;
  readonly params: SocialCallbackParams;
  readonly settle: (view: SocialCallbackView) => void;
}

export interface SocialRelayGuard {
  active: boolean;
}

export interface SocialCallbackInitial {
  readonly query: SocialCallbackQuery;
  readonly view: SocialCallbackView;
}

export type SocialProviderLabels = { readonly [Provider in SocialProvider]: string };
