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

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');

  return {
    ...actual,
    TextField: (props: TextFieldProps): JSX.Element => textFieldMock(props),
    ThemeProvider: ({ children }: PropsWithChildren): ReactNode => children ?? null,
  };
});

function FormInputFieldHarness({
  defaultValue,
  helperText = 'Helper text',
  mode,
  rules = {},
  slotProps,
}: {
  defaultValue?: string;
  helperText?: string;
  mode?: Mode;
  rules?: RegisterOptions<{ email: string }, 'email'>;
  slotProps: TextFieldProps['slotProps'];
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
      helperText={helperText}
      name="email"
      placeholder="Email"
      rules={rules}
      slotProps={slotProps}
      type="email"
    />
  );
}

describe('UIFormInputField', () => {
  beforeEach(() => {
    textFieldMock.mockClear();
  });

  it('passes TextField slotProps through to the input slot', () => {
    const inputSlotProps: NonNullable<TextFieldProps['slotProps']>['input'] = {
      endAdornment: <span>Password toggle</span>,
      sx: {
        px: 2,
      },
    };

    render(
      <FormInputFieldHarness
        slotProps={{
          input: inputSlotProps,
        }}
      />
    );

    expect(textFieldMock).toHaveBeenCalled();

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.slotProps).toEqual({
      input: inputSlotProps,
    });
    expect(textFieldProps).not.toHaveProperty('InputProps');
  });

  it('falls back to an empty string value when the field default is undefined', () => {
    render(<FormInputFieldHarness defaultValue={undefined} slotProps={undefined} />);

    expect(textFieldMock).toHaveBeenCalled();

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.value).toBe('');
    expect(textFieldProps.slotProps).toBeUndefined();
    expect(textFieldProps.helperText).toBe('Helper text');
  });

  it('prefers the validation error message over the fallback helper text', async () => {
    render(
      <FormInputFieldHarness
        defaultValue=""
        mode="onBlur"
        rules={{
          required: 'Email is required',
        }}
        slotProps={undefined}
      />
    );

    fireEvent.blur(screen.getByTestId('mui-text-field'));

    await waitFor(() => {
      const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

      expect(textFieldProps.error).toBe(true);
    });

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.helperText).toBe('Email is required');
  });
});
