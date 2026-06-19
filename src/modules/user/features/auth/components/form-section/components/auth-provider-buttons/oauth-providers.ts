import buildApiUrl from '@/utils/url-builder';
import { ReactComponent as Facebook } from '@auth/assets/social-links/facebook-color.svg';
import { ReactComponent as GitHub } from '@auth/assets/social-links/github-color.svg';
import { ReactComponent as Google } from '@auth/assets/social-links/google-color.svg';
import { ReactComponent as Twitter } from '@auth/assets/social-links/twitter-color.svg';

import type { OAuthProvider } from './oauth-providers.types';

const PROVIDERS = [
  { key: 'google', label: 'Google', SvgComponent: Google },
  { key: 'github', label: 'GitHub', SvgComponent: GitHub },
  { key: 'facebook', label: 'Facebook', SvgComponent: Facebook },
  { key: 'twitter', label: 'Twitter', SvgComponent: Twitter },
] as const;

function signInWithProvider(service: (typeof PROVIDERS)[number]['key']): void {
  if (typeof window === 'undefined') return;
  // TODO: Implement actual OAuth authentication
  //  example:
  const url = buildApiUrl(`/auth/${encodeURIComponent(service)}`);
  const win = window.open(url, '_blank', 'noopener,noreferrer');

  if (!win) {
    window.location.href = url;
  }
}

const oauthProviders: ReadonlyArray<OAuthProvider> = PROVIDERS.map((p) => ({
  label: p.label,
  SvgComponent: p.SvgComponent,
  onClick: () => signInWithProvider(p.key),
  ariaLabel: `Sign in with ${p.label}`,
}));

export default oauthProviders;
