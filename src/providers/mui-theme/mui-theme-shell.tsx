import { ThemeProvider } from '@mui/material/styles';
import type { JSX } from 'react';

import type { MuiThemeShellProps } from '@/components/types/providers';
import theme from '@/styles/theme';

export default function MuiThemeShell({ children }: MuiThemeShellProps): JSX.Element {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
