import type { TextFieldProps } from '@mui/material/TextField';
import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import type { Control, FieldValues } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';
import { buildEmail } from '@tests/builders';

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
const textFieldMock = jest.fn((props: TextFieldProps) => (
  <input
    data-testid="mui-text-field"
    name={props.name}
    onBlur={props.onBlur}
    onChange={props.onChange}
    value={typeof props.value === 'string' ? props.value : ''}
  />
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
    textFieldMock.mockClear();
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

  it('omits defaultValue from Controller and forwards helperText to TextField', () => {
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

    const [controllerProps] = controllerPropsMock.mock.calls.at(-1) as [Record<string, unknown>];

    expect(controllerProps).toEqual(
      expect.objectContaining({
        name: 'email',
      })
    );
    expect(controllerProps).not.toHaveProperty('defaultValue');

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.helperText).toBe('Helper text');
    expect(textFieldProps.error).toBe(false);
  });

  it('forwards defaultValue to Controller when provided', () => {
    const defaultValue = buildEmail();

    render(
      <UIFormInputField
        autoComplete="email"
        control={{} as Control<FieldValues>}
        defaultValue={defaultValue}
        name="email"
        placeholder="Email"
        rules={{}}
        type="email"
      />
    );

    const [controllerProps] = controllerPropsMock.mock.calls.at(-1) as [Record<string, unknown>];

    expect(controllerProps).toEqual(
      expect.objectContaining({
        defaultValue,
        name: 'email',
      })
    );
  });
});
