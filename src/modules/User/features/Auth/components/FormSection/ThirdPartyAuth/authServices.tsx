import { ReactComponent as Facebook } from '@/modules/User/features/Auth/assets/facebookColor.svg';
import { ReactComponent as Github } from '@/modules/User/features/Auth/assets/github.svg';
import { ReactComponent as Google } from '@/modules/User/features/Auth/assets/GoogleColor.svg';
import { ReactComponent as Twitter } from '@/modules/User/features/Auth/assets/twitterColor.svg';

function handleThirdPartyAuth(service: string): string {
  return `You choose ${service}`;
}

 const authServices = [
  {
    label: 'Google',
    component: <Google />,
    onClick: (): string => handleThirdPartyAuth('google'),
    ariaLabel: 'Sign in with Google',
  },
  {
    label: 'Facebook',
    component: <Facebook />,
    onClick: (): string => handleThirdPartyAuth('facebook'),
    ariaLabel: 'Sign in with Facebook',
  },
  {
    label: 'Github',
    component: <Github />,
    onClick: (): string => handleThirdPartyAuth('github'),
    ariaLabel: 'Sign in with Github',
  },
  {
    label: 'Twitter',
    component: <Twitter />,
    onClick: (): string => handleThirdPartyAuth('twitter'),
    ariaLabel: 'Sign in with Twitter',
  },
];
export default authServices;
