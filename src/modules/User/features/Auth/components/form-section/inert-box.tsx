import { Box } from '@mui/material';
import type { ReactNode } from 'react';

interface InertBoxProps {
  id: string;
  inert: boolean;
  children: ReactNode;
}

function applyInert(el: HTMLDivElement | null, inert: boolean): void {
  if (!el) return;
  if (inert) el.setAttribute('inert', '');
  else el.removeAttribute('inert');
}

export default function InertBox({ id, inert, children }: InertBoxProps): JSX.Element {
  return (
    <Box id={id} ref={(el: HTMLDivElement | null) => applyInert(el, inert)}>
      {children}
    </Box>
  );
}
