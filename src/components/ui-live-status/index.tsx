import { Box } from '@mui/material';

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
} as const;

export default function UILiveStatus({ message }: { message: string }): JSX.Element {
  return (
    <Box component="span" role="status" aria-atomic="true" sx={visuallyHidden}>
      {message}
    </Box>
  );
}
