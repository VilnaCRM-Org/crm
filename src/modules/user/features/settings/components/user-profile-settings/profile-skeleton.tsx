import Box from '@mui/material/Box';
import type { JSX } from 'react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';

import type {
  ProfileSkeletonFieldProps,
  ProfileSkeletonSectionId,
  ProfileSkeletonSectionProps,
} from '../../types/components/user-profile-settings';
import formStyles from '../profile-form/styles';
import headerStyles from '../profile-header/styles';

import styles from './styles';

const SECTIONS: readonly ProfileSkeletonSectionId[] = ['personal', 'password'];

const SECTION_FIELDS = {
  personal: ['email'],
  password: ['current-password', 'new-password'],
} as const;

const PILL_RADIUS = '3.5625rem';

function SkeletonHeader(): JSX.Element {
  return (
    <Box sx={headerStyles.header}>
      <UISkeletonBlock
        id="profile-skeleton-monogram"
        borderRadius="50%"
        sx={styles.skeletonMonogram}
      />
      <Box sx={[headerStyles.text, styles.skeletonLines]}>
        <UISkeletonBlock id="profile-skeleton-greeting" sx={styles.skeletonGreeting} />
        <UISkeletonBlock id="profile-skeleton-name" sx={styles.skeletonName} />
      </Box>
    </Box>
  );
}

function SkeletonField({ field }: ProfileSkeletonFieldProps): JSX.Element {
  return (
    <Box sx={styles.skeletonField}>
      <UISkeletonBlock id={`profile-skeleton-label-${field}`} sx={styles.skeletonLabel} />
      <UISkeletonBlock id={`profile-skeleton-input-${field}`} sx={styles.skeletonInput} />
    </Box>
  );
}

function SkeletonSection({ section }: ProfileSkeletonSectionProps): JSX.Element {
  return (
    <>
      <Box sx={formStyles.sectionTitle}>
        <UISkeletonBlock id={`profile-skeleton-title-${section}`} sx={styles.skeletonTitle} />
      </Box>
      {SECTION_FIELDS[section].map((field) => (
        <SkeletonField key={field} field={field} />
      ))}
    </>
  );
}

function SkeletonActions(): JSX.Element {
  return (
    <Box sx={styles.skeletonActions}>
      <UISkeletonBlock
        id="profile-skeleton-save"
        borderRadius={PILL_RADIUS}
        sx={[styles.skeletonPill, styles.skeletonSave]}
      />
      <UISkeletonBlock
        id="profile-skeleton-clear"
        borderRadius={PILL_RADIUS}
        sx={[styles.skeletonPill, styles.skeletonClear]}
      />
    </Box>
  );
}

export default function ProfileSkeleton(): JSX.Element {
  return (
    <Box aria-hidden="true" sx={styles.skeleton}>
      <SkeletonHeader />
      <SkeletonField field="name" />
      {SECTIONS.map((section) => (
        <SkeletonSection key={section} section={section} />
      ))}
      <Box sx={formStyles.actionsDivider} />
      <SkeletonActions />
    </Box>
  );
}
