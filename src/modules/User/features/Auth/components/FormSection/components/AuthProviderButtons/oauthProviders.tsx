import { ReactComponent as Facebook } from '@/modules/User/features/Auth/assets/facebookColor.svg';
import { ReactComponent as Github } from '@/modules/User/features/Auth/assets/github.svg';
import { ReactComponent as Google } from '@/modules/User/features/Auth/assets/GoogleColor.svg';
import { ReactComponent as Twitter } from '@/modules/User/features/Auth/assets/twitterColor.svg';

function signInWithProvider(service: string): void {
  // TODO: Implement actual OAuth authentication
  //  example:
  window.open(`/auth/${service}`, '_blank', 'noopener,noreferrer');
}
const oauthProviders = [
  {
    label: 'Google',
    component: <Google />,
    onClick: (): void => signInWithProvider('google'),
    ariaLabel: 'Sign in with Google',
  },

  {
    label: 'GitHub',
    component: <Github />,
    onClick: (): void => signInWithProvider('github'),
    ariaLabel: 'Sign in with GitHub',
  },
  {
    label: 'Facebook',
    component: <Facebook />,
    onClick: (): void => signInWithProvider('facebook'),
    ariaLabel: 'Sign in with Facebook',
  },
  {
    label: 'Twitter',
    component: <Twitter />,
    onClick: (): void => signInWithProvider('twitter'),
    ariaLabel: 'Sign in with Twitter',
  },
];
export default oauthProviders;
