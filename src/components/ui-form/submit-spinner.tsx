import { CircularProgress } from '@mui/material';

import { paletteColors } from '@/styles/colors';

export default function SubmitSpinner(): JSX.Element {
  return (
    <CircularProgress
      aria-hidden
      sx={{ color: paletteColors.background.default }}
      thickness={4.5}
      size={28}
    />
  );
}
