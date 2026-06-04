import type { TextFieldProps } from '@mui/material/TextField';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useForm, type Mode, type RegisterOptions } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';

const textFieldMock = jest.fn((props: TextFieldProps) => (
  <input
    data-testid="mui-text-field"
    name={props.name}
    onBlur={props.onBlur}
    onChange={props.onChange}
    value={typeof props.value === 'string' ? props.value : ''}
  />
));

jest.mock('@/components/ui-form-input-field/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@mui/material/TextField', () => ({
  __esModule: true,
  default: (props: TextFieldProps): JSX.Element => textFieldMock(props),
}));

jest.mock('@mui/material/styles', () => {
  const actual = jest.requireActual('@mui/material/styles');

  return {
    ...actual,
    ThemeProvider: ({ children }: PropsWithChildren): ReactNode => children ?? null,
  };
});

function FormInputFieldHarness({
  defaultValue,
  inputProps,
  helperText,
  mode,
  rules = {},
  sx,
}: {
  defaultValue?: string;
  inputProps?: TextFieldProps['InputProps'];
  helperText?: string;
  mode?: Mode;
  rules?: RegisterOptions<{ email: string }, 'email'>;
  sx?: TextFieldProps['sx'];
}): JSX.Element {
  const { control } = useForm<{ email: string }>({
    defaultValues:
      defaultValue === undefined
        ? undefined
        : {
            email: defaultValue,
          },
    mode,
  });

  return (
    <UIFormInputField
      autoComplete="email"
      control={control}
      defaultValue={defaultValue}
      InputProps={inputProps}
      helperText={helperText}
      name="email"
      placeholder="Email"
      rules={rules}
      sx={sx}
      type="email"
    />
  );
}

describe('UIFormInputField', () => {
  beforeEach(() => {
    textFieldMock.mockClear();
  });

  it('forwards InputProps and sx onto TextField directly', () => {
    const endAdornment = <span>Password toggle</span>;
    const sx: TextFieldProps['sx'] = { px: 2 };

    render(<FormInputFieldHarness inputProps={{ endAdornment }} sx={sx} />);

    expect(textFieldMock).toHaveBeenCalled();

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps).toEqual(
      expect.objectContaining({
        InputProps: { endAdornment },
        sx,
      })
    );
  });

  it('passes the field value through to TextField when no default is provided', () => {
    render(<FormInputFieldHarness defaultValue={undefined} helperText="Helper text" />);

    expect(textFieldMock).toHaveBeenCalled();

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.helperText).toBe('Helper text');
    expect(textFieldProps.error).toBe(false);
  });

  it('passes undefined helperText to TextField when none is provided', () => {
    render(<FormInputFieldHarness helperText={undefined} />);

    expect(textFieldMock).toHaveBeenCalled();

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.helperText).toBeUndefined();
  });

  it('prefers the validation error message over the fallback helper text', async () => {
    render(
      <FormInputFieldHarness
        defaultValue=""
        helperText="Helper text"
        mode="onBlur"
        rules={{
          required: 'Email is required',
        }}
      />
    );

    fireEvent.blur(screen.getByTestId('mui-text-field'));

    await waitFor(() => {
      const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

      expect(textFieldProps.helperText).toBe('Email is required');
    });

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.error).toBe(true);
  });
});
