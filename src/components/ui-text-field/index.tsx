import { ThemeProvider, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import * as React from 'react';

import Theme from '@/components/ui-text-field/theme';

export default function UITextField(props: TextFieldProps): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      {React.cloneElement(<TextField />, props)}
    </ThemeProvider>
  );
}
