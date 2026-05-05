import { ThemeProvider } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import * as React from 'react';

export default function renderWithTheme<Props extends object>(
  theme: Theme,
  Component: React.ComponentType<Props>,
  props: Props
): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      {React.createElement<Props>(Component, props)}
    </ThemeProvider>
  );
}
