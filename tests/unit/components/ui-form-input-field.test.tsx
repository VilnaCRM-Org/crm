import { fireEvent, render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { useForm, type Control, type Mode } from 'react-hook-form';

import UIFormInputField from '@/components/ui-form-input-field';

type EmailForm = { email: string };

function FormInputFieldHarness({
  defaultValues,
  mode = 'onSubmit',
  renderField,
}: {
  defaultValues?: EmailForm;
  mode?: Mode;
  renderField: (control: Control<EmailForm>) => JSX.Element;
}): JSX.Element {
  const { control } = useForm<EmailForm>(defaultValues ? { defaultValues, mode } : { mode });

  return renderField(control);
}

describe('UIFormInputField', () => {
  it('renders the input slot adornment beside the input', () => {
    render(
      <FormInputFieldHarness
        renderField={(control) => (
          <UIFormInputField
            control={control}
            name="email"
            id="email"
            rules={{}}
            slotProps={{ input: { endAdornment: <span>Password toggle</span>, readOnly: true } }}
          />
        )}
      />
    );

    expect(screen.getByText('Password toggle')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('describes the input with the fallback helper text while the value is valid', () => {
    render(
      <FormInputFieldHarness
        renderField={(control) => (
          <UIFormInputField
            control={control}
            name="email"
            id="email"
            rules={{}}
            helperText="Helper text"
          />
        )}
      />
    );

    const input = screen.getByRole('textbox');

    expect(input).toHaveAccessibleDescription('Helper text');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('renders no helper text and no description when none is provided', () => {
    render(
      <FormInputFieldHarness
        renderField={(control) => (
          <UIFormInputField control={control} name="email" id="email" rules={{}} />
        )}
      />
    );

    const input = screen.getByRole('textbox');

    expect(input).not.toHaveAttribute('aria-describedby');
    expect(input).toHaveAccessibleDescription('');
  });

  it('prefers the validation error message over the fallback helper text', async () => {
    render(
      <FormInputFieldHarness
        defaultValues={{ email: '' }}
        mode="onBlur"
        renderField={(control) => (
          <UIFormInputField
            control={control}
            defaultValue=""
            name="email"
            id="email"
            helperText="Helper text"
            rules={{ required: 'Email is required' }}
          />
        )}
      />
    );

    fireEvent.blur(screen.getByRole('textbox'));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Email is required');
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });
});
