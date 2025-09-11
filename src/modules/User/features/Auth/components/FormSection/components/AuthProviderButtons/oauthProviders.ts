import buildApiUrl from '@/utils/urlBuilder';
import type { ComponentType, SVGProps } from 'react';

import { ReactComponent as Facebook } from '@/modules/User/features/Auth/assets/social-links/facebook-color.svg';
import { ReactComponent as GitHub } from '@/modules/User/features/Auth/assets/social-links/github-color.svg';
import { ReactComponent as Google } from '@/modules/User/features/Auth/assets/social-links/google-color.svg';
import { ReactComponent as Twitter } from '@/modules/User/features/Auth/assets/social-links/twitter-color.svg';

const PROVIDERS = [
  { key: 'google', label: 'Google', SvgComponent: Google },
  { key: 'github', label: 'GitHub', SvgComponent: GitHub },
  { key: 'facebook', label: 'Facebook', SvgComponent: Facebook },
  { key: 'twitter', label: 'Twitter', SvgComponent: Twitter },
] as const;
type OAuthService = (typeof PROVIDERS)[number]['key'];

function signInWithProvider(service: OAuthService): void {
  if (typeof window === 'undefined') return;
  // TODO: Implement actual OAuth authentication
  //  example:
  const url = buildApiUrl(`/auth/${encodeURIComponent(service)}`);
  const win = window.open(url, '_blank', 'noopener,noreferrer');

  if (!win) {
    window.location.href = url;
  }
}

interface OAuthProvider {
  label: string;
  SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  ariaLabel: string;
}

const oauthProviders: ReadonlyArray<OAuthProvider> = PROVIDERS.map((p) => ({
  label: p.label,
  SvgComponent: p.SvgComponent,
  onClick: () => signInWithProvider(p.key),
  ariaLabel: `Sign in with ${p.label}`,
}));

export default oauthProviders;
