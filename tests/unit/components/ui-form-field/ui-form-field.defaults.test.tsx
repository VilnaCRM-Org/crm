import { act, render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode, createElement } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';

import type { FormFieldProps } from '@/components/types/ui-form-field';
import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import FormField from '@/components/ui-form-field';

const BASE = {
  name: 'email',
  placeholder: 'you@example.com',
  type: 'email',
  label: 'Email',
  autoComplete: 'email',
};

const captured: { form: UseFormReturn | null } = { form: null };

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const methods = useForm();
  captured.form = methods;

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

describe('FormField layout', () => {
  it('stacks the label above the input in a column flex container', () => {
    renderField(BASE as unknown as FormFieldProps);

    const label = screen.getByText('Email');
    const input = screen.getByLabelText('Email');
    const wrapper = screen
      .getAllByRole('generic')
      .filter((element) => element.contains(label) && element.contains(input))
      .at(-1);

    expect(wrapper).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
    });
  });
});

describe('FormField sx', () => {
  const grid = (): HTMLElement => {
    const label = screen.getByText('Email');
    const input = screen.getByLabelText('Email');
    const wrapper = screen
      .getAllByRole('generic')
      .filter((element) => element.contains(label) && element.contains(input))
      .at(-1);
    if (wrapper === undefined) throw new Error('field grid not found');
    return wrapper;
  };

  it('merges the sx it is given into the field grid', () => {
    renderField({ ...BASE, sx: { marginBottom: '9px' } } as unknown as FormFieldProps);

    expect(grid()).toHaveStyle({ marginBottom: '9px', flexDirection: 'column' });
  });

  it('adds no spacing to the field grid without an sx', () => {
    renderField(BASE as unknown as FormFieldProps);

    expect(grid()).not.toHaveStyle({ marginBottom: '9px' });
  });
});

describe('FormField describedBy', () => {
  const input = (): HTMLElement => screen.getByLabelText('Email');

  it('leaves aria-describedby unset without a describedBy', () => {
    renderField(BASE as unknown as FormFieldProps);

    expect(input()).not.toHaveAttribute('aria-describedby');
  });

  it('lists the describedBy ids alone while the field has no error', () => {
    renderField({ ...BASE, describedBy: 'hint-id' } as unknown as FormFieldProps);

    expect(input()).toHaveAttribute('aria-describedby', 'hint-id');
  });

  it('lists the describedBy ids first, then the helper text, while an error shows', async () => {
    renderField({ ...BASE, describedBy: 'hint-id' } as unknown as FormFieldProps);

    await act(async () => {
      captured.form?.setError('email', { type: 'server', message: 'Taken' });
    });

    expect(input()).toHaveAttribute('aria-describedby', 'hint-id email-helper-text');
  });
});
