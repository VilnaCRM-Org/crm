import { CircularProgress, useMediaQuery } from '@mui/material';

import breakpointsTheme from '@/components/ui-breakpoints';
import { paletteColors } from '@/styles/colors';

export default function SubmitSpinner(): JSX.Element {
  const isWide = useMediaQuery(breakpointsTheme.breakpoints.up('md'));
  return (
    <CircularProgress
      aria-hidden
      sx={{ color: paletteColors.background.default }}
      thickness={4.5}
      size={isWide ? 40 : 28}
    />
  );
}
