import type { TextFieldProps } from '@mui/material/TextField';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';

import UITextField from '@/components/ui-text-field';

const textFieldMock = jest.fn((props: TextFieldProps) => (
  <div data-testid="mui-text-field" data-name={props.name ?? ''} />
));

jest.mock('@/components/ui-text-field/theme', () => ({
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

describe('UITextField', () => {
  beforeEach(() => {
    textFieldMock.mockClear();
  });

  it('forwards TextField slotProps without using deprecated InputProps', () => {
    const inputSlotProps: NonNullable<TextFieldProps['slotProps']>['input'] = {
      endAdornment: <span>Password toggle</span>,
      sx: {
        py: 1,
      },
    };

    render(
      <UITextField
        id="password"
        label="Password"
        name="password"
        onBlur={jest.fn()}
        onChange={jest.fn()}
        slotProps={{
          input: inputSlotProps,
        }}
        value=""
        variant="outlined"
      />
    );

    expect(textFieldMock).toHaveBeenCalledTimes(1);

    const [textFieldProps] = textFieldMock.mock.calls[0] as [TextFieldProps];

    expect(textFieldProps.slotProps).toEqual({
      input: inputSlotProps,
    });
    expect(textFieldProps).not.toHaveProperty('InputProps');
  });

  it('forwards additional TextField props through to MUI', () => {
    const inputRef = jest.fn();

    render(
      <UITextField
        color="secondary"
        inputRef={inputRef}
        margin="dense"
        multiline
        name="bio"
        rows={4}
        size="small"
        value="Hello"
      />
    );

    expect(textFieldMock).toHaveBeenCalledTimes(1);

    const [textFieldProps] = textFieldMock.mock.calls[0] as [TextFieldProps];

    expect(textFieldProps).toEqual(
      expect.objectContaining({
        color: 'secondary',
        inputRef,
        margin: 'dense',
        multiline: true,
        name: 'bio',
        rows: 4,
        size: 'small',
        value: 'Hello',
      })
    );
  });
});
