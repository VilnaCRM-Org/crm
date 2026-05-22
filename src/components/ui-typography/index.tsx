import { ThemeProvider, Typography } from '@mui/material';
import React from 'react';

import theme from '@/components/ui-typography/theme';
import { UITypographyProps } from '@/components/ui-typography/types';

function UITypography({
  sx,
  children,
  component,
  variant,
  id,
  role,
  htmlFor,
}: UITypographyProps): React.ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <Typography
        sx={sx}
        component={component || 'p'}
        variant={variant}
        id={id}
        role={role}
        htmlFor={htmlFor}
      >
        {children}
      </Typography>
    </ThemeProvider>
  );
}

export default UITypography;
