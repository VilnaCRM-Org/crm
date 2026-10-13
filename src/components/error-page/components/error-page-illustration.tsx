import Box from '@mui/material/Box';
import type { JSX } from 'react';

import { ReactComponent as CurveArt } from '@/assets/illustrations/error-page/curve.svg';
import { ReactComponent as DiamondArt } from '@/assets/illustrations/error-page/diamond.svg';
import { ReactComponent as DotColumnsArt } from '@/assets/illustrations/error-page/dot-columns.svg';
import { ReactComponent as DotRowsArt } from '@/assets/illustrations/error-page/dot-rows.svg';
import dotStyles from '@/components/error-page/styles/dot-styles';
import illustrationStyles from '@/components/error-page/styles/illustration-styles';

const styles = illustrationStyles.build();
const dots = dotStyles.build();

export default function ErrorPageIllustration(): JSX.Element {
  return (
    <Box aria-hidden="true" sx={styles.layer}>
      <Box sx={styles.tab} />
      <Box component={CurveArt} focusable="false" role="presentation" sx={styles.curve} />
      <Box component={DiamondArt} focusable="false" role="presentation" sx={styles.diamond} />
      <Box sx={dots.dot} />
      <Box component={DotColumnsArt} focusable="false" role="presentation" sx={dots.dotColumns} />
      <Box component={DotRowsArt} focusable="false" role="presentation" sx={dots.dotRows} />
    </Box>
  );
}
