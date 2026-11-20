import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
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

let controllerRenderParams: ControllerRenderParams = {
  field: {
    name: 'email',
    onBlur: jest.fn(),
    onChange: jest.fn(),
    ref: jest.fn(),
  },
  fieldState: {
    invalid: false,
  },
};

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
    controllerRenderParams = {
      field: {
        name: 'email',
        onBlur: jest.fn(),
        onChange: jest.fn(),
        ref: jest.fn(),
        value: '',
      },
      fieldState: {
        invalid: false,
      },
    };
  });

  it('omits defaultValue from Controller and renders the helper text', () => {
    render(
      <UIFormInputField
        autoComplete="email"
        control={{} as Control<FieldValues>}
        helperText="Helper text"
        id="email"
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

    const input = screen.getByRole('textbox');

    expect(input).toHaveAccessibleDescription('Helper text');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toHaveAttribute('placeholder', 'Email');
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

  it('hands the field ref to the native input', () => {
    render(
      <UIFormInputField control={{} as Control<FieldValues>} id="email" name="email" rules={{}} />
    );

    expect(controllerRenderParams.field.ref).toHaveBeenCalledWith(screen.getByRole('textbox'));
  });
});
