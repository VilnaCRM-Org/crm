import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';

import renderWithTheme from '@/components/render-with-theme';
import Theme from '@/components/ui-text-field/theme';

export default function UITextField(props: TextFieldProps): JSX.Element {
  return renderWithTheme(Theme, TextField, props);
}
