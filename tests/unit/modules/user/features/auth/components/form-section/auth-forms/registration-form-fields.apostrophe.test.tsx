import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TFunction } from 'i18next';
import type { JSX } from 'react';

import UIForm from '@/components/ui-form';
import type { SignUpDto } from '@/modules/user';
import formValidators from '@/modules/user/lib/validations';
import { RegistrationFormFields } from '@auth/components/form-section/auth-forms';
import { buildEmail } from '@tests/builders';
import render from '@tests/unit/utils/render-with-i18n';

const t = ((key: string) => key) as unknown as TFunction;

const validators = formValidators.create<SignUpDto>(t);

function SignUpFields({ onSubmit }: { onSubmit: (values: SignUpDto) => void }): JSX.Element {
  return (
    <UIForm<SignUpDto>
      onSubmit={onSubmit}
      defaultValues={{ fullName: '', email: '', password: '' }}
      title="Sign up"
      submitLabel="Submit"
      submittingLabel="Submitting"
    >
      <RegistrationFormFields t={t} validators={validators} />
    </UIForm>
  );
}

describe('RegistrationFormFields with a typographic apostrophe in the name', () => {
  it.each(['Мар’яна Коваль', 'Марʼяна Коваль'])(
    'submits %s verbatim with no name error',
    async (fullName) => {
      const onSubmit = jest.fn();
      const email = buildEmail();
      render(<SignUpFields onSubmit={onSubmit} />);

      await userEvent.type(
        screen.getByRole('textbox', { name: 'sign_up.form.name_input.label' }),
        fullName
      );
      await userEvent.type(screen.getByLabelText('sign_up.form.email_input.label'), email);
      await userEvent.type(
        screen.getByLabelText('sign_up.form.password_input.label'),
        'Password123'
      );
      await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0]?.[0]).toEqual({ fullName, email, password: 'Password123' });
      expect(
        screen.queryByText('sign_up.form.name_input.special_characters_error')
      ).not.toBeInTheDocument();
    }
  );

  it('still rejects a left single quotation mark as a separator', async () => {
    const onSubmit = jest.fn();
    render(<SignUpFields onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByRole('textbox', { name: 'sign_up.form.name_input.label' }),
      'Мар‘яна Коваль'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(
      await screen.findByText('sign_up.form.name_input.special_characters_error')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
