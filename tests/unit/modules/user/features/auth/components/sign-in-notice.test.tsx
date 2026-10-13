import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import SignInNotice from '@auth/components/sign-in-notice';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const i18n = createLocaleI18n('uk');

function Wrapper({ children }: { children: ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <main>{children}</main>
    </I18nextProvider>
  );
}

describe('SignInNotice', () => {
  it('renders the password-reset notice in a polite status region', async () => {
    const view = render(<SignInNotice notice="password_reset" />, { wrapper: Wrapper });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Пароль змінено. Увійдіть з новим паролем.'
    );
    await expectNoA11yViolations(view.container);
  });

  it('renders nothing without a notice', () => {
    render(<SignInNotice notice={null} />, { wrapper: Wrapper });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
