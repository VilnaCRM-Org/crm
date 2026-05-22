import { Typography } from '@mui/material';
import React from 'react';

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

export default UITypography;
