import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { styled, ThemeProvider } from '@mui/material/styles';
import React, { useId } from 'react';
import { Controller, FieldValues } from 'react-hook-form';

import type {
  ControlledFieldProps,
  CustomTextField,
  FormTextFieldProps,
  FormTextFieldViewProps,
  RenderFieldArgs,
  TextFieldInputProps,
} from '@/components/types/ui-form-input-field';
import theme from '@/components/ui-form-input-field/theme';

const TextFieldRoot = styled(FormControl, { name: 'MuiTextField', slot: 'Root' })({});

function TextFieldInput({
  field: {
    autoComplete,
    fullWidth,
    name,
    type,
    value,
    inputRef,
    onBlur,
    onChange,
    onFocus,
    placeholder,
    label,
    slotProps = {},
  },
  id,
  describedBy,
}: TextFieldInputProps): React.ReactElement {
  return (
    <OutlinedInput
      aria-describedby={describedBy}
      autoComplete={autoComplete}
      fullWidth={fullWidth}
      name={name}
      type={type}
      value={value}
      id={id}
      inputRef={inputRef}
      onBlur={onBlur}
      onChange={onChange}
      onFocus={onFocus}
      placeholder={placeholder}
      inputProps={slotProps.htmlInput}
      label={label}
      endAdornment={slotProps.input?.endAdornment}
      readOnly={slotProps.input?.readOnly}
    />
  );
}

function FormTextField({ field }: FormTextFieldViewProps): React.ReactElement {
  const { disabled, error, fullWidth, helperText, id: idOverride, label, required, sx } = field;
  const generatedId = useId();
  const id = idOverride ?? generatedId;
  const helperTextId = helperText && id ? `${id}-helper-text` : undefined;

  return (
    <TextFieldRoot
      className="MuiTextField-root"
      disabled={disabled}
      error={error}
      fullWidth={fullWidth}
      required={required}
      sx={sx}
    >
      {label ? (
        <InputLabel htmlFor={id} id={id ? `${id}-label` : undefined}>
          {label}
        </InputLabel>
      ) : null}
      <TextFieldInput field={field} id={id} describedBy={helperTextId} />
      {helperText ? <FormHelperText id={helperTextId}>{helperText}</FormHelperText> : null}
    </TextFieldRoot>
  );
}

function createRenderField<T extends FieldValues>(
  textFieldProps: ControlledFieldProps<T>['textFieldProps']
): (args: RenderFieldArgs<T>) => React.ReactElement {
  return function fieldView({
    field: { ref, ...field },
    fieldState,
  }: RenderFieldArgs<T>): React.ReactElement {
    const props: FormTextFieldProps = {
      ...textFieldProps,
      ...field,
      inputRef: ref,
      error: fieldState.invalid,
      helperText: fieldState.error?.message ?? textFieldProps.helperText,
    };
    return <FormTextField field={props} />;
  };
}

function ControlledField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  textFieldProps,
}: ControlledFieldProps<T>): React.ReactElement {
  const view = createRenderField<T>(textFieldProps);

  if (defaultValue !== undefined) {
    return (
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={rules}
        render={view}
      />
    );
  }

  return <Controller name={name} control={control} rules={rules} render={view} />;
}

export default function UIFormInputField<T extends FieldValues>({
  control,
  rules,
  defaultValue,
  name,
  ...props
}: CustomTextField<T>): React.ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <ControlledField
        control={control}
        rules={rules}
        defaultValue={defaultValue}
        name={name}
        textFieldProps={props}
      />
    </ThemeProvider>
  );
}
