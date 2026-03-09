import type { TextFieldProps } from '@mui/material/TextField';
import { render } from '@testing-library/react';
import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import type { Control, FieldValues } from 'react-hook-form';

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

jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');

  return {
    ...actual,
    TextField: (props: TextFieldProps): JSX.Element => textFieldMock(props),
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

  it('uses the defaultValue parameter fallback and normalizes undefined field values to an empty string', async () => {
    let importedModule: typeof import('@/components/ui-form-input-field') | undefined;

    await jest.isolateModulesAsync(async () => {
      importedModule = await import('@/components/ui-form-input-field');
    });

    const UIFormInputField = importedModule?.default as ComponentType<{
      autoComplete: string;
      control: Control<FieldValues>;
      helperText: string;
      name: string;
      placeholder: string;
      rules: Record<string, never>;
      type: string;
      defaultValue?: string;
    }>;

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

    const [textFieldProps] = textFieldMock.mock.calls.at(-1) as [TextFieldProps];

    expect(textFieldProps.value).toBe('');
    expect(textFieldProps.helperText).toBe('Helper text');
  });
});
