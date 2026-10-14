import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';

import ResetPasswordSentStep from '@auth/components/reset-password/reset-password-sent-step';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@auth/assets/chevron-left.svg', () => ({
  __esModule: true,
  ReactComponent: (): JSX.Element => <svg />,
}));

const MASKED_EMAIL = 'eir*****@gmail.com';

const renderSentStep = (onBack: () => void = jest.fn()): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={createRecoveryLocaleI18n('uk')}>
      <MemoryRouter initialEntries={['/password-recovery']}>
        <main>
          <ResetPasswordSentStep maskedEmail={MASKED_EMAIL} onBack={onBack} />
        </main>
      </MemoryRouter>
    </I18nextProvider>
  );

describe('ResetPasswordSentStep', () => {
  it('focuses the sent heading and announces the masked address', async () => {
    renderSentStep();

    expect(screen.getByRole('heading', { level: 1, name: 'Перевірте пошту' })).toHaveFocus();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(MASKED_EMAIL));
  });

  it('links "До входу" to /sign-in', () => {
    renderSentStep();

    expect(screen.getByRole('link', { name: 'До входу' })).toHaveAttribute('href', '/sign-in');
  });

  it('renders Назад as a button that returns to the form', async () => {
    const onBack = jest.fn();
    renderSentStep(onBack);

    await userEvent.click(screen.getByRole('button', { name: 'Назад' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { name: 'Назад' })).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const view = renderSentStep();

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(MASKED_EMAIL));
    await expectNoA11yViolations(view.container);
  });
});
