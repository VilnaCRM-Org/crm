import * as React from 'react';

import { ReactComponent as FacebookIcon } from '@/assets/icons/facebook.svg';
import { ReactComponent as GitHubIcon } from '@/assets/icons/github.svg';
import { ReactComponent as InstagramIcon } from '@/assets/icons/instagram.svg';
import { ReactComponent as LinkedInIcon } from '@/assets/icons/linkedin.svg';
import UILink from '@/components/UILink';

import Styles from './styles';

export default function SocialMedia(): React.ReactElement {
  const links = [
    { href: '#', icon: <InstagramIcon style={Styles.uiSvgItem} /> },
    { href: '#', icon: <GitHubIcon style={Styles.uiSvgItem} /> },
    { href: '#', icon: <FacebookIcon style={Styles.uiSvgItem} /> },
    { href: '#', icon: <LinkedInIcon style={Styles.uiSvgItem} /> },
  ];

  return (
    <>
      {links.map((link: { href: string; icon: React.ReactElement }) => (
        <UILink href={link.href} key={Math.floor(Math.random() * 100000)} sx={Styles.uiLinkItem}>
          {link.icon}
        </UILink>
      ))}
    </>
  );
}
