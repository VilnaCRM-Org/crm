import { ThemeProvider, Link } from '@mui/material';
import type { LinkProps } from '@mui/material/Link';
import * as React from 'react';

import Theme from '@/components/ui-link/theme';

export default function UILink(props: LinkProps): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      {React.cloneElement(<Link />, props)}
    </ThemeProvider>
  );
}
