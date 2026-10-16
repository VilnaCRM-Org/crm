import Box from '@mui/material/Box';
import type { JSX } from 'react';

import UISkeletonBlock from '@/components/skeletons/ui-skeleton-block';
import UISkeletonButton from '@/components/skeletons/ui-skeleton-button';
import UISkeletonInput from '@/components/skeletons/ui-skeleton-input';
import UISkeletonText from '@/components/skeletons/ui-skeleton-text';

import styles from './styles';

const FIELDS = ['name', 'email', 'current-password', 'new-password'] as const;

export default function ProfileSkeleton(): JSX.Element {
  return (
    <Box aria-hidden="true" sx={styles.skeleton}>
      <Box sx={styles.skeletonHeader}>
        <UISkeletonBlock id="profile-skeleton-monogram" width={64} height={64} borderRadius="50%" />
        <Box sx={styles.skeletonLines}>
          <UISkeletonText id="profile-skeleton-greeting" size="s" width="40%" />
          <UISkeletonText id="profile-skeleton-name" size="l" width="70%" />
        </Box>
      </Box>
      {FIELDS.map((field) => (
        <Box key={field} sx={styles.skeletonField}>
          <UISkeletonText id={`profile-skeleton-label-${field}`} size="m" width="30%" />
          <UISkeletonInput id={`profile-skeleton-input-${field}`} />
        </Box>
      ))}
      <UISkeletonButton id="profile-skeleton-save" />
    </Box>
  );
}
