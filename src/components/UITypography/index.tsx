import { Typography, ThemeProvider } from '@mui/material';
import { TypographyProps } from '@mui/material/Typography';
import React from 'react';

import Theme from '@/components/UITypography/Theme';

export default function UITypography(props: TypographyProps): JSX.Element {
  const { children } = props;

  return (
    <ThemeProvider theme={Theme}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Typography {...props}>{children}</Typography>
    </ThemeProvider>
  );
}
