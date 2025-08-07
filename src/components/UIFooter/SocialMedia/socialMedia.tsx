import { Box } from '@mui/material';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import UILink from '@/components/UILink';

import { socialLinks, SocialLinks } from './constants';
import styles from './styles';

export default function SocialMedia(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Box sx={styles.uiLinksWrapper}>
      {socialLinks.map((link: SocialLinks) => (
        <UILink
          href={link.linkHref}
          key={link.alt}
          sx={styles.uiLinkItem}
          aria-label={t(link.ariaLabel)}
          target="_blank"
        >
          <img src={link.icon} alt={t(link.alt)} style={styles.uiSvgItem} />
        </UILink>
      ))}
    </Box>
  );
}
