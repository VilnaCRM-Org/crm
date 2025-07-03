import { Box } from '@mui/material';
import * as React from 'react';

import { ReactComponent as FacebookIcon } from '@/assets/icons/facebook.svg';
import { ReactComponent as GitHubIcon } from '@/assets/icons/github.svg';
import { ReactComponent as InstagramIcon } from '@/assets/icons/instagram.svg';
import { ReactComponent as LinkedInIcon } from '@/assets/icons/linkedin.svg';
import UILink from '@/components/UILink';

import Styles from './styles';

export default function SocialMedia(): React.ReactElement {
  const links = [
    { href: '#', label: 'instagram', icon: <InstagramIcon style={Styles.uiSvgItem} /> },
    { href: '#', label: 'github', icon: <GitHubIcon style={Styles.uiSvgItem} /> },
    { href: '#', label: 'facebook', icon: <FacebookIcon style={Styles.uiSvgItem} /> },
    { href: '#', label: 'linkedin', icon: <LinkedInIcon style={Styles.uiSvgItem} /> },
  ];

  return (
    <Box sx={Styles.uiLinksWrapper}>
      {links.map((link: { href: string; icon: React.ReactElement; label: string }) => (
        <UILink href={link.href} key={link.label} sx={Styles.uiLinkItem}>
          {link.icon}
        </UILink>
      ))}
    </Box>
  );
}
