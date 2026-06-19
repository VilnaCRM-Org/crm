import { Box } from '@mui/material';
import { useCallback } from 'react';

import type { InertBoxProps } from './inert-box.types';

function applyInert(el: HTMLDivElement | null, inert: boolean): void {
  if (!el) return;
  if (inert) el.setAttribute('inert', '');
  else el.removeAttribute('inert');
}

export default function InertBox({ id, inert, children }: InertBoxProps): JSX.Element {
  const setInertRef = useCallback(
    (el: HTMLDivElement | null): void => applyInert(el, inert),
    [inert]
  );

  return (
    <Box id={id} ref={setInertRef}>
      {children}
    </Box>
  );
}
