import { ReactComponent as Facebook } from '@/assets/icons/social/facebook-color.svg';
import { ReactComponent as GitHub } from '@/assets/icons/social/github-color.svg';
import { ReactComponent as Google } from '@/assets/icons/social/google-color.svg';
import { ReactComponent as Twitter } from '@/assets/icons/social/twitter-color.svg';
import type {
  OAuthProviderList,
  OAuthProviderStart,
} from '@auth/types/auth-provider-buttons/oauth-providers';

const PROVIDERS = [
  { key: 'google', label: 'Google', SvgComponent: Google },
  { key: 'facebook', label: 'Facebook', SvgComponent: Facebook },
  { key: 'github', label: 'GitHub', SvgComponent: GitHub },
  { key: 'twitter', label: 'Twitter', SvgComponent: Twitter },
] as const;

class OAuthProviders {
  public list(start: OAuthProviderStart): OAuthProviderList {
    return {
      items: PROVIDERS.map((p) => ({
        label: p.label,
        SvgComponent: p.SvgComponent,
        onClick: () => start(p.key),
      })),
    };
  }
}

const oauthProviders = new OAuthProviders();

export default oauthProviders;
