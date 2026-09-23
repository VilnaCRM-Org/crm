import { Typography } from '@mui/material';
import React from 'react';

import type { UITypographyProps } from '@/components/ui-typography/types';

function UITypography({ children, component, ...rest }: UITypographyProps): React.ReactElement {
  return React.cloneElement(<Typography component={component || 'p'}>{children}</Typography>, rest);
}

export default UITypography;
