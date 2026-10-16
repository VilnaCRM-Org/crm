import { act, render, screen } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';

import FormProviderBridge from '@/components/ui-form/form-provider-bridge';
import UIFormField from '@/components/ui-form-field';

const captured: { form: UseFormReturn | null } = { form: null };

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  const methods = useForm();
  captured.form = methods;

  return <FormProviderBridge methods={methods}>{children}</FormProviderBridge>;
}

describe('UIFormField error message colour', () => {
  it('renders the message in the error.text token, not the error.main border colour', async () => {
    render(
      <Wrapper>
        <UIFormField
          name="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          rules={{}}
        />
      </Wrapper>
    );

    await act(async () => {
      captured.form?.setError('email', { type: 'server', message: 'Taken' });
    });

    expect(screen.getByText('Taken')).toHaveStyle({ color: 'rgb(198, 40, 40)' });
  });
});
