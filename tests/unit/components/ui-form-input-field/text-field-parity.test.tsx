import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { ThemeProvider } from '@mui/material/styles';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Controller, type FieldErrors, useForm } from 'react-hook-form';

import type {
  CustomTextField,
  FormTextFieldProps,
  RenderFieldArgs,
} from '@/components/types/ui-form-input-field';
import UIFormInputField from '@/components/ui-form-input-field';
import theme from '@/components/ui-form-input-field/theme';

type Values = { email: string };
type FieldComponent = (props: CustomTextField<Values>) => ReactElement;

interface ParityCase {
  title: string;
  marker: string;
  props: FormTextFieldProps;
  value?: string;
  errors?: FieldErrors<Values>;
  focus?: boolean;
}

interface HarnessProps {
  Field: FieldComponent;
  parityCase: ParityCase;
}

function MuiTextFieldReference({
  control,
  rules,
  name,
  ...textFieldProps
}: CustomTextField<Values>): ReactElement {
  const view = ({
    field: { ref, ...field },
    fieldState,
  }: RenderFieldArgs<Values>): ReactElement => (
    <TextField
      {...(textFieldProps as TextFieldProps)}
      {...field}
      inputRef={ref}
      error={fieldState.invalid}
      helperText={fieldState.error?.message ?? textFieldProps.helperText}
    />
  );

  return (
    <ThemeProvider theme={theme}>
      <Controller name={name} control={control} rules={rules} render={view} />
    </ThemeProvider>
  );
}

function Harness({ Field, parityCase }: HarnessProps): ReactElement {
  const { control } = useForm<Values>({
    defaultValues: { email: parityCase.value ?? '' },
    ...(parityCase.errors === undefined ? {} : { errors: parityCase.errors }),
  });
  const { props } = parityCase;

  return (
    <Field
      control={control}
      name="email"
      rules={{}}
      autoComplete={props.autoComplete}
      disabled={props.disabled}
      fullWidth={props.fullWidth}
      helperText={props.helperText}
      id={props.id}
      label={props.label}
      placeholder={props.placeholder}
      required={props.required}
      slotProps={props.slotProps}
      sx={props.sx}
      type={props.type}
    />
  );
}

const REACT_ID = /«r[0-9a-z]+»|_r_[0-9a-z]+_|:r[0-9a-z]+:/g;

function markupOf(Field: FieldComponent, parityCase: ParityCase): string {
  const view = render(<Harness Field={Field} parityCase={parityCase} />);
  if (parityCase.focus === true) {
    act(() => screen.getByRole('textbox').focus());
  }
  const markup = new XMLSerializer().serializeToString(view.asFragment());
  view.unmount();
  return markup.replace(REACT_ID, 'react-id');
}

const passwordToggle = (
  <InputAdornment position="end">
    <IconButton aria-label="Show password" aria-pressed={false} edge="end">
      <svg aria-hidden="true" />
    </IconButton>
  </InputAdornment>
);

const parityCases: ParityCase[] = [
  {
    title: 'plain field with placeholder, type, autocomplete and sx',
    marker: 'placeholder="name@example.com"',
    props: {
      id: 'email',
      type: 'email',
      autoComplete: 'email',
      placeholder: 'name@example.com',
      sx: { minWidth: '10rem' },
    },
  },
  {
    title: 'floating label with helper text',
    marker: 'aria-describedby="email-helper-text"',
    props: { id: 'email', label: 'Email', helperText: 'We never share it' },
  },
  {
    title: 'floating label over a filled value',
    marker: 'data-shrink="true"',
    props: { id: 'email', label: 'Email' },
    value: 'person@example.com',
  },
  {
    title: 'validation error replacing the helper text',
    marker: 'Email is required',
    props: { id: 'email', label: 'Email', helperText: 'We never share it' },
    errors: { email: { type: 'required', message: 'Email is required' } },
  },
  {
    title: 'validation error without a label',
    marker: 'aria-invalid="true"',
    props: { id: 'email', placeholder: 'name@example.com' },
    errors: { email: { type: 'validate', message: 'Email is invalid' } },
  },
  {
    title: 'password field with an end adornment, readOnly and a merged describedby',
    marker: 'aria-describedby="password-rules password-helper-text"',
    props: {
      id: 'password',
      type: 'password',
      autoComplete: 'current-password',
      placeholder: 'Password',
      slotProps: {
        input: { endAdornment: passwordToggle, readOnly: true },
        htmlInput: { 'aria-describedby': 'password-rules password-helper-text' },
      },
    },
    errors: { email: { type: 'required', message: 'Password is required' } },
  },
  {
    title: 'required field with a label asterisk',
    marker: 'MuiFormLabel-asterisk',
    props: { id: 'email', label: 'Email', required: true },
  },
  {
    title: 'disabled full-width field with html input attributes',
    marker: 'MuiFormControl-fullWidth',
    props: {
      id: 'code',
      fullWidth: true,
      disabled: true,
      helperText: 'Enter one recovery code',
      slotProps: { htmlInput: { autoCapitalize: 'characters', spellCheck: false } },
    },
  },
  {
    title: 'empty id with label and helper text',
    marker: 'for=""',
    props: { id: '', label: 'Email', helperText: 'We never share it' },
  },
  {
    title: 'generated id with label and helper text',
    marker: 'id="react-id-helper-text"',
    props: { label: 'Email', helperText: 'We never share it' },
  },
  {
    title: 'empty label and helper text',
    marker: 'notranslate',
    props: { id: 'email', label: '', helperText: '' },
  },
  {
    title: 'focused field with a label',
    marker: 'Mui-focused',
    props: { id: 'email', label: 'Email', helperText: 'We never share it' },
    focus: true,
  },
];

describe('UIFormInputField renders the same DOM as MUI TextField', () => {
  it.each(parityCases)('$title', (parityCase) => {
    const expected = markupOf(MuiTextFieldReference, parityCase);

    expect(expected).toContain('MuiTextField-root');
    expect(expected).toContain(parityCase.marker);
    expect(markupOf(UIFormInputField<Values>, parityCase)).toBe(expected);
  });

  it('keeps emotion class names identical, so the generated CSS is the same', () => {
    const parityCase = parityCases[1] as ParityCase;
    const classes = (markup: string): string[] => markup.match(/css-[0-9a-z]+-[\w-]+/g) ?? [];
    const expected = classes(markupOf(MuiTextFieldReference, parityCase));

    expect(expected.length).toBeGreaterThan(3);
    expect(classes(markupOf(UIFormInputField<Values>, parityCase))).toEqual(expected);
  });
});
