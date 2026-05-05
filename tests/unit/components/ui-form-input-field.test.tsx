import type { FormHelperTextProps } from '@mui/material/FormHelperText';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useForm, type Mode, type RegisterOptions } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';

const outlinedInputMock = jest.fn((props: OutlinedInputProps) => (
  <input
    data-testid="mui-outlined-input"
    name={props.name}
    onBlur={props.onBlur}
    onChange={props.onChange}
    value={typeof props.value === 'string' ? props.value : ''}
  />
));
const formHelperTextMock = jest.fn((props: FormHelperTextProps) => (
  <div data-testid="mui-form-helper-text">{props.children}</div>
));

jest.mock('@/components/ui-form-input-field/theme', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@mui/material/FormHelperText', () => ({
  __esModule: true,
  default: (props: FormHelperTextProps): JSX.Element => formHelperTextMock(props),
}));

jest.mock('@mui/material/OutlinedInput', () => ({
  __esModule: true,
  default: (props: OutlinedInputProps): JSX.Element => outlinedInputMock(props),
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
  endAdornment,
  helperText,
  mode,
  rules = {},
  sx,
}: {
  defaultValue?: string;
  endAdornment?: OutlinedInputProps['endAdornment'];
  helperText?: string;
  mode?: Mode;
  rules?: RegisterOptions<{ email: string }, 'email'>;
  sx?: OutlinedInputProps['sx'];
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
      endAdornment={endAdornment}
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
    outlinedInputMock.mockClear();
    formHelperTextMock.mockClear();
  });

  it('forwards endAdornment and sx onto OutlinedInput directly', () => {
    const endAdornment = <span>Password toggle</span>;
    const sx: OutlinedInputProps['sx'] = { px: 2 };

    render(<FormInputFieldHarness endAdornment={endAdornment} sx={sx} />);

    expect(outlinedInputMock).toHaveBeenCalled();

    const [outlinedInputProps] = outlinedInputMock.mock.calls.at(-1) as [OutlinedInputProps];

    expect(outlinedInputProps).toEqual(
      expect.objectContaining({
        endAdornment,
        sx,
      })
    );
    expect(outlinedInputProps).not.toHaveProperty('slotProps');
  });

  it('falls back to an empty string value when the field default is undefined', () => {
    render(<FormInputFieldHarness defaultValue={undefined} helperText="Helper text" />);

    expect(outlinedInputMock).toHaveBeenCalled();

    const [outlinedInputProps] = outlinedInputMock.mock.calls.at(-1) as [OutlinedInputProps];

    expect(outlinedInputProps.value).toBe('');
    expect(outlinedInputProps).not.toHaveProperty('slotProps');
    const [formHelperTextProps] = formHelperTextMock.mock.calls.at(-1) as [FormHelperTextProps];

    expect(formHelperTextProps).toEqual(
      expect.objectContaining({
        children: 'Helper text',
        error: false,
      })
    );
  });

  it('omits aria-describedby and FormHelperText when helperText is not provided', () => {
    render(<FormInputFieldHarness helperText={undefined} />);

    expect(outlinedInputMock).toHaveBeenCalled();

    const [outlinedInputProps] = outlinedInputMock.mock.calls.at(-1) as [OutlinedInputProps];

    expect(outlinedInputProps['aria-describedby']).toBeUndefined();
    expect(formHelperTextMock).not.toHaveBeenCalled();
  });

  it('prefers the validation error message over the fallback helper text', async () => {
    render(
      <FormInputFieldHarness
        defaultValue=""
        mode="onBlur"
        rules={{
          required: 'Email is required',
        }}
      />
    );

    fireEvent.blur(screen.getByTestId('mui-outlined-input'));

    await waitFor(() => {
      const [outlinedInputProps] = outlinedInputMock.mock.calls.at(-1) as [OutlinedInputProps];

      expect(outlinedInputProps.error).toBe(true);
    });

    const [formHelperTextProps] = formHelperTextMock.mock.calls.at(-1) as [FormHelperTextProps];

    expect(formHelperTextProps).toEqual(
      expect.objectContaining({
        children: 'Email is required',
        error: true,
      })
    );
  });
});
