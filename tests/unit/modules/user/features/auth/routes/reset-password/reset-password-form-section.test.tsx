import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import ResetPasswordFormSection from '@auth/routes/reset-password/reset-password-form-section';
import type { ResetPasswordOutcome } from '@auth/types/password-recovery/outcome';
import { buildEmail } from '@tests/builders';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const requestReset = jest.fn<Promise<ResetPasswordOutcome>, []>();

jest.mock('@auth/hooks/use-auth-provider-loader', () => ({
  __esModule: true,
  default: (): { resolve: () => Promise<{ requestReset: typeof requestReset }> } => ({
    resolve: async () => ({ requestReset }),
  }),
}));

jest.mock('@auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

jest.mock('@auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

jest.mock('@auth/assets/chevron-left.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

const i18n = createRecoveryLocaleI18n('uk');
const EMAIL = buildEmail();

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/password-recovery']}>
        <main>{children}</main>
      </MemoryRouter>
    </I18nextProvider>
  );
}

async function submitEmail(): Promise<void> {
  await userEvent.type(screen.getByRole('textbox', { name: 'E-mail' }), EMAIL);
  await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
}

describe('ResetPasswordFormSection', () => {
  beforeEach(() => {
    resetClientStores();
    requestReset.mockReset().mockResolvedValue({
      kind: 'sent',
      maskedEmail: 'eir*****@gmail.com',
    });
  });

  it('renders the request form with Назад linking to /sign-in', async () => {
    const view = render(<ResetPasswordFormSection />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { level: 1, name: 'Забули пароль?' })).not.toHaveFocus();
    expect(screen.getByRole('link', { name: 'Назад' })).toHaveAttribute('href', '/sign-in');
    await expectNoA11yViolations(view.container);
  });

  it('shows the focused sent step with the masked address and the sign-in link', async () => {
    const view = render(<ResetPasswordFormSection />, { wrapper: Wrapper });

    await submitEmail();

    const heading = await screen.findByRole('heading', { level: 1, name: 'Перевірте пошту' });
    expect(heading).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('eir*****@gmail.com'));
    expect(screen.getByRole('link', { name: 'До входу' })).toHaveAttribute('href', '/sign-in');
    await expectNoA11yViolations(view.container);
  });

  it('offers the demo reset link on the sent step only for the demo e-mail', async () => {
    render(<ResetPasswordFormSection />, { wrapper: Wrapper });
    await userEvent.type(screen.getByRole('textbox', { name: 'E-mail' }), 'demo@vilnacrm.com');
    await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

    await screen.findByRole('heading', { level: 1, name: 'Перевірте пошту' });
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'До входу',
      'Відкрити посилання з листа (демо)',
    ]);
    expect(links[1]).toHaveAttribute('href', '/password-reset?token=sandbox-demo-reset-token');
    expect(screen.getByRole('status')).not.toContainElement(links[1] ?? null);
  });

  it('shows no demo link on the sent step for any other e-mail', async () => {
    render(<ResetPasswordFormSection />, { wrapper: Wrapper });
    await submitEmail();

    await screen.findByRole('heading', { level: 1, name: 'Перевірте пошту' });
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual(['До входу']);
  });

  it('returns from the sent step to the refilled form with the heading focused', async () => {
    render(<ResetPasswordFormSection />, { wrapper: Wrapper });
    await submitEmail();
    await screen.findByRole('heading', { level: 1, name: 'Перевірте пошту' });
    expect(screen.queryByRole('link', { name: 'Назад' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Забули пароль?' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveValue(EMAIL);
    expect(requestReset).toHaveBeenCalledTimes(1);
  });

  it('focuses the sent heading again on a second round trip', async () => {
    render(<ResetPasswordFormSection />, { wrapper: Wrapper });
    await submitEmail();
    await screen.findByRole('heading', { level: 1, name: 'Перевірте пошту' });
    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));

    await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

    const heading = await screen.findByRole('heading', { level: 1, name: 'Перевірте пошту' });
    expect(heading).toHaveFocus();
    expect(requestReset).toHaveBeenCalledTimes(2);
  });
});
