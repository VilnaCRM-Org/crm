import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import type { ProfileHeaderProps } from '../../types/components/profile-header';

import styles from './styles';

const MONOGRAM_LETTERS = 2;

function monogramOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, MONOGRAM_LETTERS)
    .map((word) => Array.from(word)[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function ProfileHeader({ fullName }: ProfileHeaderProps): JSX.Element {
  const { t } = useTranslation();
  const monogram = monogramOf(fullName);

  return (
    <Box sx={styles.header}>
      <Box aria-hidden="true" sx={styles.monogram}>
        {monogram === '' ? <PersonOutlinedIcon sx={styles.glyph} /> : monogram}
      </Box>
      <Box sx={styles.text}>
        <Box component="p" sx={styles.greeting}>
          {t('settings.profile.greeting')}
        </Box>
        <Box component="p" sx={styles.name}>
          {fullName}
        </Box>
      </Box>
    </Box>
  );
}
