import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import Box from '@mui/material/Box';
import SvgIcon from '@mui/material/SvgIcon';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EditIcon } from '@/assets/icons/edit-02.svg';

import type { ProfileHeaderProps } from '../../types/components/profile-header';

import styles from './styles';

const MONOGRAM_LETTERS = 2;

function monogramOf(fullName: string): string {
  return Array.from(fullName.matchAll(/(?<!\S)\S/gu), ([initial]) => initial)
    .slice(0, MONOGRAM_LETTERS)
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
        <Box sx={styles.badge}>
          <SvgIcon component={EditIcon} inheritViewBox sx={styles.badgeIcon} />
        </Box>
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
