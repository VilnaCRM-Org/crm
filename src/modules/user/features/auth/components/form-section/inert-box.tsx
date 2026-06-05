import { Box } from '@mui/material';
import { type ReactNode, useCallback } from 'react';

interface InertBoxProps {
  id: string;
  inert: boolean;
  children: ReactNode;
  'data-testid'?: string;
}

function applyInert(el: HTMLDivElement | null, inert: boolean): void {
  if (!el) return;
  if (inert) el.setAttribute('inert', '');
  else el.removeAttribute('inert');
}

export default function InertBox({
  id,
  inert,
  children,
  'data-testid': dataTestId,
}: InertBoxProps): JSX.Element {
  const setInertRef = useCallback(
    (el: HTMLDivElement | null): void => applyInert(el, inert),
    [inert]
  );

  return (
    <Box id={id} data-testid={dataTestId} ref={setInertRef}>
      {children}
    </Box>
  );
}
