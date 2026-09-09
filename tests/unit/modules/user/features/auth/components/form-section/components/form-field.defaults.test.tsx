import { render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode, createElement } from 'react';
import { useForm } from 'react-hook-form';

import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
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

  // The app's own bridge, so this stays clear of the prop-spreading rule.
  return <FormProviderBridge methods={methods}>{children}</FormProviderBridge>;
}

const renderField = (props: FormFieldProps): void => {
  render(<Wrapper>{createElement(FormField, props)}</Wrapper>);
};

describe('FormField parameter defaults', () => {
  it('renders a labelled field when a caller supplies no validation rules', () => {
    renderField(BASE as unknown as FormFieldProps);

    // The label's htmlFor={name} and the input's id={name} now match, so the field is reachable
    // by its accessible name.
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('');
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
