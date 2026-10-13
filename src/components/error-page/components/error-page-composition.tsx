import Box from '@mui/material/Box';
import type { JSX } from 'react';

import errorPageStyles from '@/components/error-page/styles/error-page-styles';
import type { ErrorPageVariantProps } from '@/components/types/error-page';

import ErrorPageCard from './error-page-card';
import ErrorPageDigits from './error-page-digits';
import ErrorPageIllustration from './error-page-illustration';

const styles = errorPageStyles.build();

export default function ErrorPageComposition({ variant }: ErrorPageVariantProps): JSX.Element {
  return (
    <Box sx={styles.composition}>
      <ErrorPageIllustration />
      <ErrorPageDigits variant={variant} />
      <ErrorPageCard variant={variant} />
    </Box>
  );
}
