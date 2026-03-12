import { ThemeProvider, TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';

import Theme from '@/components/ui-text-field/theme';

export default function UITextField({
  autoComplete,
  color,
  defaultValue,
  disabled,
  error,
  fullWidth,
  helperText,
  id,
  inputRef,
  label,
  margin,
  multiline,
  name,
  onBlur,
  onChange,
  placeholder,
  required,
  rows,
  size,
  slotProps,
  sx,
  type,
  value,
  variant,
}: TextFieldProps): JSX.Element {
  return (
    <ThemeProvider theme={Theme}>
      <TextField
        autoComplete={autoComplete}
        color={color}
        defaultValue={defaultValue}
        disabled={disabled}
        error={error}
        fullWidth={fullWidth}
        helperText={helperText}
        id={id}
        inputRef={inputRef}
        label={label}
        margin={margin}
        multiline={multiline}
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        size={size}
        slotProps={slotProps}
        sx={sx}
        type={type}
        value={value}
        variant={variant}
      />
    </ThemeProvider>
  );
}
