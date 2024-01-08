import * as React from 'react';

import { ReactComponent as FacebookIcon } from '@/assets/icons/facebook.svg';
import { ReactComponent as GitHubIcon } from '@/assets/icons/github.svg';
import { ReactComponent as InstagramIcon } from '@/assets/icons/instagram.svg';
import { ReactComponent as LinkedInIcon } from '@/assets/icons/linkedin.svg';
import UILink from '@/components/UILink';

export default function SocialMedia() {
  const links = [
    { href: '#', icon: <InstagramIcon style={{ color: '#1B2327' }} /> },
    { href: '#', icon: <GitHubIcon style={{ color: '#1B2327' }} /> },
    { href: '#', icon: <FacebookIcon style={{ color: '#1B2327' }} /> },
    { href: '#', icon: <LinkedInIcon style={{ color: '#1B2327' }} /> },
  ];

  return (
    <>
    {links.map((link: { href: string, icon: JSX.Element }) => (
        <UILink
          className=''
          href={link.href}
          key={Math.floor(Math.random() * 100000 )}
          sx={{ height: '2.5rem', marginRight: '8px' }}
        >
          {link.icon}
        </UILink>
      ))}
    </>
  )
}
