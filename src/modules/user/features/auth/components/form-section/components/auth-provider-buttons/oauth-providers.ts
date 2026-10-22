import { ReactComponent as Facebook } from '@/assets/icons/social/facebook-color.svg';
import { ReactComponent as GitHub } from '@/assets/icons/social/github-color.svg';
import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { ReactComponent as Twitter } from '@/assets/icons/social/twitter-color.svg';
import urlBuilder from '@/utils/url-builder';
import type { OAuthProviderList } from '@auth/types/auth-provider-buttons/oauth-providers';
import browserNavigator from '@auth/utils/browser-navigator';

const PROVIDERS = [
  { key: 'google', label: 'Google', SvgComponent: Google },
  { key: 'facebook', label: 'Facebook', SvgComponent: Facebook },
  { key: 'github', label: 'GitHub', SvgComponent: GitHub },
  { key: 'twitter', label: 'Twitter', SvgComponent: Twitter },
] as const;

class OAuthProviders {
  public list(): OAuthProviderList {
    return {
      items: PROVIDERS.map((p) => ({
        label: p.label,
        SvgComponent: p.SvgComponent,
        onClick: () => this.signInWithProvider(p.key),
      })),
    };
  }

  private signInWithProvider(service: (typeof PROVIDERS)[number]['key']): void {
    browserNavigator.openInNewTab(urlBuilder.build(`/auth/${encodeURIComponent(service)}`));
  }
}

const oauthProviders = new OAuthProviders().list();

export default oauthProviders;
