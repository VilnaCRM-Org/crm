import { CircularProgress } from '@mui/material';

import { customColors } from '@/styles/colors';

export default function SubmitSpinner(): JSX.Element {
  return (
    <CircularProgress
      aria-hidden
      sx={{ color: customColors.text.primary }}
      thickness={4.5}
      size={28}
    />
  );
}
