import type { FormHelperTextProps } from '@mui/material/FormHelperText';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import type { Control, FieldValues } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';

type ControllerRenderParams = {
  field: {
    name: string;
    onBlur: jest.Mock;
    onChange: jest.Mock;
    ref: jest.Mock;
    value?: string;
  };
  fieldState: {
    invalid: boolean;
    error?: {
      message?: string;
    };
  };
};

const controllerPropsMock = jest.fn();
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

let controllerRenderParams: ControllerRenderParams = {
  field: {
    name: 'email',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    ref: jest.fn(),
    value: undefined,
  },
  fieldState: {
    invalid: false,
  },
};

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

jest.mock('react-hook-form', () => {
  const actual = jest.requireActual('react-hook-form');

  return {
    ...actual,
    Controller: ({
      render: renderField,
      ...props
    }: {
      render: (params: ControllerRenderParams) => ReactNode;
    }): ReactNode => {
      controllerPropsMock(props);

      return renderField(controllerRenderParams);
    },
  };
});

describe('UIFormInputField controller branches', () => {
  beforeEach(() => {
    controllerPropsMock.mockClear();
    outlinedInputMock.mockClear();
    formHelperTextMock.mockClear();
    controllerRenderParams = {
      field: {
        name: 'email',
        onBlur: jest.fn(),
        onChange: jest.fn(),
        ref: jest.fn(),
        value: undefined,
      },
      fieldState: {
        invalid: false,
      },
    };
  });

  it('uses the defaultValue parameter fallback and normalizes undefined field values to an empty string', async () => {
    render(
      <UIFormInputField
        autoComplete="email"
        control={{} as Control<FieldValues>}
        helperText="Helper text"
        name="email"
        placeholder="Email"
        rules={{}}
        type="email"
      />
    );

    expect(controllerPropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValue: undefined,
        name: 'email',
      })
    );

    const [outlinedInputProps] = outlinedInputMock.mock.calls.at(-1) as [OutlinedInputProps];
    const [formHelperTextProps] = formHelperTextMock.mock.calls.at(-1) as [FormHelperTextProps];

    expect(outlinedInputProps.value).toBe('');
    expect(formHelperTextProps).toEqual(
      expect.objectContaining({
        children: 'Helper text',
        error: false,
      })
    );
  });
});
