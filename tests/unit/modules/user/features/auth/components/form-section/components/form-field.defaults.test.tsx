import { render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode, createElement } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import FormField from '@auth/components/form-section/components/form-field';
import type { FormFieldProps } from '@auth/types/components/form-field';

// The field's style module pulls in the password-toggle SVGs, which jest cannot transform.
jest.mock('@auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

jest.mock('@auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

const BASE = {
  name: 'email',
  placeholder: 'you@example.com',
  type: 'email',
  label: 'Email',
  autoComplete: 'email',
};

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const methods = useForm();

  return createElement(FormProvider, { ...methods, children });
}

const renderField = (props: FormFieldProps): void => {
  render(<Wrapper>{createElement(FormField, props)}</Wrapper>);
};

describe('FormField parameter defaults', () => {
  it('renders a labelled field when a caller supplies no validation rules', () => {
    renderField(BASE as unknown as FormFieldProps);

    // Queried by placeholder and role: the label carries htmlFor={name} while MUI generates its
    // own input id, so the two are not associated and getByLabelText cannot find the field.
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders the same field when rules, defaultValue and inputProps are supplied', () => {
    renderField({
      ...BASE,
      rules: { required: 'Email is required' },
      defaultValue: 'seed@example.com',
      inputProps: { readOnly: true },
    } as unknown as FormFieldProps);

    expect(screen.getByRole('textbox')).toHaveValue('seed@example.com');
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});
