import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';

import PasswordField from '@auth/components/form-section/components/password-field';
import PasswordPolicyRules from '@auth/components/form-section/components/password-policy-rules';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

jest.mock('@auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

interface Values {
  password: string;
  confirmPassword: string;
}

const i18n = createRecoveryLocaleI18n('uk');
const MISMATCH = 'Паролі не збігаються';

function Harness(): JSX.Element {
  const methods = useForm<Values>({ defaultValues: { password: '', confirmPassword: '' } });
  return (
    <I18nextProvider i18n={i18n}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => undefined)}>
          <PasswordField<Values>
            placeholder="new"
            label="Новий пароль"
            autoComplete="new-password"
            describedBy="rules-id"
          />
          <PasswordPolicyRules id="rules-id" name="password" />
          <PasswordField<Values>
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

describe('PasswordField generalised', () => {
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

describe('PasswordPolicyRules', () => {
  const ruleStates = (): string[] =>
    screen.getAllByRole('listitem').map((item) => item.textContent ?? '');

  it('marks the rules for Pa1: only the length is unmet', async () => {
    render(<Harness />);

    await userEvent.type(newPassword(), 'Pa1');

    expect(ruleStates()).toEqual([
      'Від 8 до 64 символів не виконано',
      'Принаймні одна цифра виконано',
      'Принаймні одна велика латинська літера (A–Z) виконано',
      'Принаймні одна мала літера виконано',
    ]);
  });

  it.each([
    ['PASSWORD1', 3],
    ['Пароль123', 2],
  ])('marks %s with rule %i unmet', async (value, index) => {
    render(<Harness />);

    await userEvent.type(newPassword(), value);

    expect(ruleStates()[index]).toMatch(/не виконано$/);
  });

  it('is referenced by the field and is not a live region', () => {
    render(<Harness />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    expect(list).toHaveAttribute('id', 'rules-id');
    expect(list).not.toHaveAttribute('aria-live');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has no axe violations with met and unmet rules', async () => {
    const view = render(<Harness />);
    await userEvent.type(newPassword(), 'Pa1');

    await expectNoA11yViolations(view.container);
  });

  it('treats an unregistered field as empty', () => {
    function Bare(): JSX.Element {
      const methods = useForm();
      return (
        <I18nextProvider i18n={i18n}>
          <FormProvider {...methods}>
            <PasswordPolicyRules id="bare-rules" name="password" />
          </FormProvider>
        </I18nextProvider>
      );
    }
    render(<Bare />);

    expect(ruleStates()[0]).toMatch(/не виконано$/);
  });
});
