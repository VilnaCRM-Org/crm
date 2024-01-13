import { ThemeProvider, TextField } from '@mui/material';
import { TextFieldProps } from '@mui/material/TextField';
import React from 'react';

import Theme from './Theme';

export default function UITextField(props: TextFieldProps): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <TextField {...props} />
    </ThemeProvider>
  );
}
