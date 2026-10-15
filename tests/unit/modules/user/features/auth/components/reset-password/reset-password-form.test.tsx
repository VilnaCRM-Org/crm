import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import ResetPasswordForm from '@auth/components/reset-password/reset-password-form';
import type { ResetPasswordFormProps } from '@auth/types/password-recovery/components';
import type { RecoveryFailure } from '@auth/types/password-recovery/outcome';
import { buildEmail } from '@tests/builders';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

jest.mock('@auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

jest.mock('@auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

const i18n = createRecoveryLocaleI18n('uk');

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <main>{children}</main>
    </I18nextProvider>
  );
}

const mountForm = (overrides: Partial<ResetPasswordFormProps> = {}): ResetPasswordFormProps => {
  const props: ResetPasswordFormProps = {
    defaultValues: { email: '' },
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onDismissFailure: jest.fn(),
    failure: null,
    isSubmitting: false,
    focusTitle: false,
    ...overrides,
  };
  render(
    <ResetPasswordForm
      defaultValues={props.defaultValues}
      onSubmit={props.onSubmit}
      onDismissFailure={props.onDismissFailure}
      failure={props.failure}
      isSubmitting={props.isSubmitting}
      focusTitle={props.focusTitle}
    />,
    { wrapper: Wrapper }
  );
  return props;
};

const emailField = (): HTMLElement => screen.getByRole('textbox', { name: 'E-mail' });
const submit = (): HTMLElement => screen.getByRole('button', { name: 'Підтвердити' });

describe('ResetPasswordForm', () => {
  beforeEach(() => resetClientStores());

  it('renders the heading, body, e-mail field and submit and nothing else', () => {
    mountForm();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Забули пароль?' })).toBeInTheDocument();
    expect(
      screen.getByText('Введіть адресу поштової скриньки вашого аккаунту')
    ).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('autocomplete', 'email');
    expect(emailField()).toHaveAttribute('placeholder', 'vilnaCRM@gmail.com');
    expect(submit()).toHaveAttribute('type', 'submit');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('rejects an empty value with the required message without calling onSubmit', async () => {
    const { onSubmit } = mountForm();

    await userEvent.click(submit());

    expect(await screen.findByText("Це поле обов'язкове")).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveAttribute('aria-describedby');
    expect(emailField()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects user@domain with the basic-format message without calling onSubmit', async () => {
    const { onSubmit } = mountForm();
    await userEvent.type(emailField(), 'user@domain');

    await userEvent.click(submit());

    await waitFor(() => expect(emailField()).toHaveAttribute('aria-invalid', 'true'));
    expect(emailField()).toHaveAccessibleDescription(
      i18n.t('sign_up.form.email_input.email_format_error')
    );
    expect(emailField()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('passes the DTO as is on a valid submit', async () => {
    const { onSubmit } = mountForm();
    const email = buildEmail();

    await userEvent.type(emailField(), email);
    await userEvent.click(submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(jest.mocked(onSubmit).mock.calls[0]?.[0]).toEqual({ email });
  });

  it('shows the busy state while submitting', () => {
    mountForm({ isSubmitting: true });

    expect(submit()).toBeDisabled();
    expect((submit() as HTMLButtonElement).form).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Надсилання…')).toBeInTheDocument();
  });

  it('puts the server e-mail error on the field and focuses it', async () => {
    const failure: RecoveryFailure = { reason: 'invalid_email', retryable: false };
    mountForm({ failure });

    expect(
      await screen.findByText('Перевірте адресу електронної пошти та спробуйте ще раз')
    ).toBeInTheDocument();
    expect(emailField()).toHaveAttribute('aria-invalid', 'true');
    expect(emailField()).toHaveFocus();
  });

  it('refills the field and focuses the heading when re-entered from the sent step', () => {
    const email = buildEmail();
    mountForm({ defaultValues: { email }, focusTitle: true });

    expect(emailField()).toHaveValue(email);
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('does not focus the heading on the first visit', () => {
    mountForm();

    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus();
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveAttribute('tabindex');
  });

  it('shows the offline notice and disables the submit while offline', () => {
    mountForm();

    act(() => useConnectivityStore.setState({ online: false }));

    expect(
      screen.getByText("Ви офлайн. Надсилання недоступне, доки з'єднання не відновиться.")
    ).toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it.each([
    ['the default state', null],
    ['an error state', { reason: 'network', retryable: true } as RecoveryFailure],
  ])('has no axe violations in %s', async (_name, failure) => {
    mountForm({ failure });

    await expectNoA11yViolations(document.body);
  });
});
