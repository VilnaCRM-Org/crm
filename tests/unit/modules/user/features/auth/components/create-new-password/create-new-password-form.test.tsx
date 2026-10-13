import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import useConnectivityStore from '@/lib/connectivity/use-connectivity-store';
import CreateNewPasswordForm from '@auth/components/create-new-password/create-new-password-form';
import type { CreateNewPasswordFormProps } from '@auth/types/password-recovery/components';
import { buildResetToken } from '@tests/builders';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
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

const i18n = createLocaleI18n('uk');
const VALID = 'Password1';

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <main>{children}</main>
    </I18nextProvider>
  );
}

const mountForm = (
  overrides: Partial<CreateNewPasswordFormProps> = {}
): CreateNewPasswordFormProps => {
  const props: CreateNewPasswordFormProps = {
    token: buildResetToken(),
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onRetry: jest.fn().mockResolvedValue(undefined),
    failure: null,
    isSubmitting: false,
    ...overrides,
  };
  render(
    <CreateNewPasswordForm
      token={props.token}
      onSubmit={props.onSubmit}
      onRetry={props.onRetry}
      failure={props.failure}
      isSubmitting={props.isSubmitting}
    />,
    { wrapper: Wrapper }
  );
  return props;
};

const newPassword = (): HTMLElement => screen.getByLabelText('Новий пароль');
const confirmation = (): HTMLElement => screen.getByLabelText('Підтвердьте пароль');
const submit = (): HTMLElement => screen.getByRole('button', { name: 'Підтвердити' });

describe('CreateNewPasswordForm', () => {
  beforeEach(() => resetClientStores());

  it('renders the heading, both password fields, the rule list and the submit', () => {
    const { token } = mountForm();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Створіть новий пароль' })).toBeInTheDocument();
    expect(screen.getByText('Придумайте новий пароль для вашого акаунту')).toBeInTheDocument();
    [newPassword(), confirmation()].forEach((field) => {
      expect(field).toHaveAttribute('type', 'password');
      expect(field).toHaveAttribute('autocomplete', 'new-password');
    });
    screen.getAllByRole('button', { name: 'Показати пароль' }).forEach((toggle) => {
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
    });
    expect(newPassword()).toHaveAttribute('aria-describedby', 'new-password-rules');
    expect(screen.getByRole('list')).toHaveAttribute('id', 'new-password-rules');
    expect(submit()).toHaveAttribute('type', 'submit');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain(token);
  });

  it('names the first unmet rule on the new-password field and does not submit', async () => {
    const { onSubmit } = mountForm();
    await userEvent.type(newPassword(), 'password1');
    await userEvent.type(confirmation(), 'password1');

    await userEvent.click(submit());

    expect(
      await screen.findByText('Будь ласка, додайте принаймні одну велику латинську літеру (A–Z)')
    ).toBeInTheDocument();
    expect(newPassword()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires the confirmation', async () => {
    mountForm();
    await userEvent.type(newPassword(), VALID);

    await userEvent.click(submit());

    expect(await screen.findByText("Це поле обов'язкове")).toBeInTheDocument();
  });

  it('shows a mismatch on the confirmation and clears it once the values match', async () => {
    mountForm();
    await userEvent.type(newPassword(), VALID);
    await userEvent.type(confirmation(), `${VALID}x`);

    await userEvent.click(submit());

    expect(await screen.findByText('Паролі не збігаються')).toBeInTheDocument();
    expect(confirmation()).toHaveFocus();
    await userEvent.type(newPassword(), 'x');
    await waitFor(() => expect(screen.queryByText('Паролі не збігаються')).not.toBeInTheDocument());
  });

  it('hands the DTO values to onSubmit on a valid submit', async () => {
    const { onSubmit, token } = mountForm();
    await userEvent.type(newPassword(), VALID);
    await userEvent.type(confirmation(), VALID);

    await userEvent.click(submit());

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(jest.mocked(onSubmit).mock.calls[0]?.[0]).toMatchObject({
      token,
      newPassword: VALID,
    });
  });

  it('puts a policy rejection on the new-password field and keeps both values', async () => {
    mountForm({ failure: { reason: 'policy_rejected', retryable: false } });

    expect(
      await screen.findByText('Пароль не відповідає вимогам. Перевірте правила нижче')
    ).toBeInTheDocument();
    expect(newPassword()).toHaveFocus();
    expect(screen.getByRole('list')).toBeVisible();
  });

  it('shows the busy state while submitting', () => {
    mountForm({ isSubmitting: true });

    expect(screen.getByText('Збереження…')).toBeInTheDocument();
    expect((submit() as HTMLButtonElement).form).toHaveAttribute('aria-busy', 'true');
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
    ['resting', null],
    ['error', { reason: 'server', retryable: true } as const],
  ])('has no axe violations in the %s state', async (_name, failure) => {
    mountForm({ failure });

    await expectNoA11yViolations(document.body);
  });
});
