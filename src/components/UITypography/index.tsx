import { Typography } from '@mui/material';
import React from 'react';

import { UiTypographyProps } from './types';

function UiTypography({
  sx,
  children,
  component,
  variant,
  id,
  role,
  htmlFor,
}: UiTypographyProps): React.ReactElement {
  return (
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
  );
}

export default UiTypography;
