import type { ComponentType, SVGProps } from 'react';

import buildApiUrl from '@/utils/url-builder';
import { ReactComponent as Facebook } from '@auth/assets/social-links/facebook-color.svg';
import { ReactComponent as GitHub } from '@auth/assets/social-links/github-color.svg';
import { ReactComponent as Google } from '@auth/assets/social-links/google-color.svg';
import { ReactComponent as Twitter } from '@auth/assets/social-links/twitter-color.svg';

const PROVIDERS = [
  { key: 'google', label: 'Google', SvgComponent: Google },
  { key: 'github', label: 'GitHub', SvgComponent: GitHub },
  { key: 'facebook', label: 'Facebook', SvgComponent: Facebook },
  { key: 'twitter', label: 'Twitter', SvgComponent: Twitter },
] as const;
type OAuthService = (typeof PROVIDERS)[number]['key'];

interface OAuthProvider {
  label: string;
  SvgComponent: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  ariaLabel: string;
}

class OAuthProviders {
  public list(): ReadonlyArray<OAuthProvider> {
    return PROVIDERS.map((p) => ({
      label: p.label,
      SvgComponent: p.SvgComponent,
      onClick: () => this.signInWithProvider(p.key),
      ariaLabel: `Sign in with ${p.label}`,
    }));
  }

  private signInWithProvider(service: OAuthService): void {
    if (typeof window === 'undefined') return;
    // TODO: Implement actual OAuth authentication
    //  example:
    const url = buildApiUrl(`/auth/${encodeURIComponent(service)}`);
    const win = window.open(url, '_blank', 'noopener,noreferrer');

    if (!win) {
      window.location.href = url;
    }
  }
}

const oauthProviders = new OAuthProviders().list();

export default oauthProviders;
