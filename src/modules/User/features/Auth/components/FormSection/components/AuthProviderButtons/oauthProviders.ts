import { ReactComponent as Facebook } from '@/modules/User/features/Auth/assets/social-links/facebook-color.svg';
import { ReactComponent as GitHub } from '@/modules/User/features/Auth/assets/social-links/github-color.svg';
import { ReactComponent as Google } from '@/modules/User/features/Auth/assets/social-links/google-color.svg';
import { ReactComponent as Twitter } from '@/modules/User/features/Auth/assets/social-links/twitter-color.svg';

function signInWithProvider(service: string): void {
  // TODO: Implement actual OAuth authentication
  //  example:
  window.open(`/auth/${service}`, '_blank', 'noopener,noreferrer');
}

interface OAuthProvider {
  label: string;
  SvgComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  ariaLabel: string;
}

const oauthProviders: OAuthProvider[] = [
  {
    label: 'Google',
    SvgComponent: Google,
    onClick: (): void => signInWithProvider('google'),
    ariaLabel: 'Sign in with Google',
  },

  {
    label: 'GitHub',
    SvgComponent: GitHub,
    onClick: (): void => signInWithProvider('github'),
    ariaLabel: 'Sign in with GitHub',
  },
  {
    label: 'Facebook',
    SvgComponent: Facebook,
    onClick: (): void => signInWithProvider('facebook'),
    ariaLabel: 'Sign in with Facebook',
  },
  {
    label: 'Twitter',
    SvgComponent: Twitter,
    onClick: (): void => signInWithProvider('twitter'),
    ariaLabel: 'Sign in with Twitter',
  },
];

export default oauthProviders;
