import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import type { PasswordRuleViewSet } from '@/components/types/ui-password-policy-rules';
import UIPasswordField from '@/components/ui-password-field';
import UIPasswordPolicyRules from '@/components/ui-password-policy-rules';
import passwordValidator from '@/modules/user/lib/validations/password';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@/assets/icons/eye.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

jest.mock('@/assets/icons/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

interface Values {
  password: string;
  confirmPassword: string;
}

const i18n = createRecoveryLocaleI18n('uk');
const MISMATCH = 'Паролі не збігаються';
const passwordRules = {
  required: i18n.t('sign_up.form.password_input.required'),
  validate: passwordValidator.create<Values>(i18n.t),
};
const evaluatePassword = (value: string): PasswordRuleViewSet => passwordValidator.evaluate(value);

function SilentHarness(): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { password: '', confirmPassword: '' } });
  return (
    <I18nextProvider i18n={i18n}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => undefined)}>
          <UIPasswordField<Values>
            placeholder="new"
            label="Новий пароль"
            autoComplete="new-password"
            describedBy="rules-id"
            rules={{ validate: () => false }}
          />
          <UIPasswordPolicyRules id="rules-id" name="password" evaluate={evaluatePassword} />
          <button type="submit">Надіслати</button>
        </form>
      </FormProvider>
    </I18nextProvider>
  );
}

function Harness(): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { password: '', confirmPassword: '' } });
  return (
    <I18nextProvider i18n={i18n}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => undefined)}>
          <UIPasswordField<Values>
            placeholder="new"
            label="Новий пароль"
            autoComplete="new-password"
            describedBy="rules-id"
            rules={passwordRules}
          />
          <UIPasswordPolicyRules id="rules-id" name="password" evaluate={evaluatePassword} />
          <UIPasswordField<Values>
            placeholder="repeat"
            label="Повторіть пароль"
            autoComplete="new-password"
            name="confirmPassword"
            rules={{
              validate: (value, values) => value === values.password || MISMATCH,
            }}
          />
          <button type="submit">Надіслати</button>
        </form>
      </FormProvider>
    </I18nextProvider>
  );
}

const newPassword = (): HTMLElement => screen.getByLabelText('Новий пароль');
const confirmPassword = (): HTMLElement => screen.getByLabelText('Повторіть пароль');

describe('UIPasswordField generalised', () => {
  it('follows the name prop and runs the given rule', async () => {
    render(<Harness />);
    expect(confirmPassword()).toHaveAttribute('name', 'confirmPassword');
    expect(confirmPassword()).toHaveAttribute('id', 'confirmPassword');

    await userEvent.type(newPassword(), 'Password1');
    await userEvent.type(confirmPassword(), 'Password2');
    await userEvent.click(screen.getByRole('button', { name: 'Надіслати' }));

    expect(await screen.findByText(MISMATCH)).toBeInTheDocument();
  });

  it('passes autocomplete through to the input', () => {
    render(<Harness />);

    expect(newPassword()).toHaveAttribute('autocomplete', 'new-password');
  });

  it('lists the rules id alone, then with the helper text once an error shows', async () => {
    render(<Harness />);
    expect(newPassword()).toHaveAttribute('aria-describedby', 'rules-id');

    await userEvent.click(screen.getByRole('button', { name: 'Надіслати' }));

    await waitFor(() =>
      expect(newPassword()).toHaveAttribute('aria-describedby', 'rules-id password-helper-text')
    );
  });

  it('keeps the rules id alone when an error carries no message', async () => {
    render(<SilentHarness />);

    await userEvent.click(screen.getByRole('button', { name: 'Надіслати' }));

    await waitFor(() => expect(newPassword()).toHaveAttribute('aria-invalid', 'true'));
    expect(newPassword()).toHaveAttribute('aria-describedby', 'rules-id');
  });

  it('toggles visibility with Space', async () => {
    render(<Harness />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getAllByRole('button', { name: 'Показати пароль' })[0]).toHaveFocus();
    await userEvent.keyboard(' ');

    expect(newPassword()).toHaveAttribute('type', 'text');
    const hide = screen.getByRole('button', { name: 'Приховати пароль' });
    expect(hide).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard(' ');
    expect(newPassword()).toHaveAttribute('type', 'password');
  });

  it('has no axe violations with an error shown', async () => {
    const view = render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Надіслати' }));
    await screen.findAllByText("Це поле обов'язкове");

    await expectNoA11yViolations(view.container);
  });
});
