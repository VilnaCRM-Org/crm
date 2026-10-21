import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';

import FormSection from '@auth/routes/create-new-password/create-new-password-form-section';
import type { CreateNewPasswordOutcome } from '@auth/types/password-recovery/outcome';
import { buildPassword, buildResetToken } from '@tests/builders';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';
import { resetClientStores } from '@tests/utils/reset-client-stores';

const confirmReset = jest.fn<Promise<CreateNewPasswordOutcome>, []>();

jest.mock('@auth/hooks/use-auth-provider-loader', () => ({
  __esModule: true,
  default: (): { resolve: () => Promise<{ confirmReset: typeof confirmReset }> } => ({
    resolve: async () => ({ confirmReset }),
  }),
}));

const mockResetTokenActive: boolean[] = [];

jest.mock('@auth/hooks/use-reset-token', () => {
  const actual = jest.requireActual<{ default: (active: boolean) => string | null }>(
    '@auth/hooks/use-reset-token'
  );
  return {
    __esModule: true,
    default: (active: boolean): string | null => {
      mockResetTokenActive.push(active);
      return actual.default(active);
    },
  };
});

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

const mountAt = (entry: string): ReturnType<typeof createMemoryRouter> => {
  const router = createMemoryRouter(
    [
      {
        path: '/password-reset',
        element: (
          <main>
            <FormSection />
          </main>
        ),
      },
      { path: '/sign-in', element: <p>sign-in page</p> },
    ],
    { initialEntries: [entry] }
  );
  render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
  return router;
};

jest.mock('@auth/components/reset-password/styles', () => {
  const actual = jest.requireActual('@auth/components/reset-password/styles');
  return {
    __esModule: true,
    default: { ...actual.default, recoveryCard: { borderTopColor: 'rgb(1, 2, 3)' } },
  };
});

const recoveryCard = (): HTMLElement | undefined =>
  screen.getAllByRole('generic').find((element) => element.id === 'auth-form-card');

describe('CreateNewPasswordFormSection', () => {
  beforeEach(() => {
    resetClientStores();
    confirmReset.mockReset().mockResolvedValue({ kind: 'confirmed' });
    mockResetTokenActive.length = 0;
  });

  it('draws the invalid-link state in the recovery card variant', async () => {
    mountAt('/password-reset');

    await screen.findByRole('heading', { level: 1, name: 'Посилання недійсне' });
    expect(recoveryCard()).toHaveStyle({ borderTopColor: 'rgb(1, 2, 3)' });
  });

  it('renders the form for a usable token and strips it from the URL', async () => {
    const token = buildResetToken();
    const router = mountAt(`/password-reset?token=${token}`);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Створіть новий пароль' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Назад' })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('');
    expect(document.body.innerHTML).not.toContain(token);
    await expectNoA11yViolations(document.body);
  });

  it('renders the invalid-link state without a token and sends nothing', async () => {
    mountAt('/password-reset');

    const heading = await screen.findByRole('heading', { level: 1, name: 'Посилання недійсне' });
    expect(heading).toHaveFocus();
    expect(
      screen.getByText(/^Посилання для відновлення пароля недійсне або його термін дії минув\./)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Запросити нове посилання' })).toHaveAttribute(
      'href',
      '/password-recovery'
    );
    expect(confirmReset).not.toHaveBeenCalled();
    await expectNoA11yViolations(document.body);
  });

  it('switches to the invalid-link state when the token is refused', async () => {
    confirmReset.mockResolvedValue({
      kind: 'failed',
      failure: { reason: 'invalid_link', retryable: false },
    });
    mountAt(`/password-reset?token=${buildResetToken()}`);
    await screen.findByRole('heading', { level: 1, name: 'Створіть новий пароль' });

    const password = buildPassword();
    await userEvent.type(screen.getByLabelText('Новий пароль'), password);
    await userEvent.type(screen.getByLabelText('Підтвердьте пароль'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Посилання недійсне' })
    ).toBeInTheDocument();
    expect(mockResetTokenActive[0]).toBe(true);
    expect(mockResetTokenActive.at(-1)).toBe(false);
  });

  it('navigates to sign-in after a confirmed reset', async () => {
    const router = mountAt(`/password-reset?token=${buildResetToken()}`);
    await screen.findByRole('heading', { level: 1, name: 'Створіть новий пароль' });

    const password = buildPassword();
    await userEvent.type(screen.getByLabelText('Новий пароль'), password);
    await userEvent.type(screen.getByLabelText('Підтвердьте пароль'), password);
    await userEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));

    expect(await screen.findByText('sign-in page')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ focusMain: true, notice: 'password_reset' });
  });
});
