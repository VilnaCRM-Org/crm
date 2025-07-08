import { ReactComponent as Facebook } from '@/modules/User/features/Auth/assets/facebookColor.svg';
import { ReactComponent as Github } from '@/modules/User/features/Auth/assets/github.svg';
import { ReactComponent as Google } from '@/modules/User/features/Auth/assets/GoogleColor.svg';
import { ReactComponent as Twitter } from '@/modules/User/features/Auth/assets/twitterColor.svg';

function handleThirdPartyAuth(service: string): void {
  // TODO: Implement actual OAuth authentication
  //  example:
  window.location.href = `/auth/${service}`;
}
const authServices = [
  {
    label: 'Google',
    component: <Google />,
    onClick: (): void => handleThirdPartyAuth('google'),
    ariaLabel: 'Sign in with Google',
  },
  {
    label: 'Facebook',
    component: <Facebook />,
    onClick: (): void => handleThirdPartyAuth('facebook'),
    ariaLabel: 'Sign in with Facebook',
  },
  {
    label: 'GitHub',
    component: <Github />,
    onClick: (): void => handleThirdPartyAuth('github'),
    ariaLabel: 'Sign in with GitHub',
  },
  {
    label: 'Twitter',
    component: <Twitter />,
    onClick: (): void => handleThirdPartyAuth('twitter'),
    ariaLabel: 'Sign in with Twitter',
  },
];
export default authServices;
