import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JSX } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';

import sandboxDemoSessionProvider from '@/config/env/sandbox-demo-session-provider';
import SandboxDemoResetLink from '@auth/components/reset-password/sandbox-demo-reset-link';
import { buildEmail } from '@tests/builders';
import createRecoveryLocaleI18n from '@tests/unit/utils/create-recovery-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const DEMO_EMAIL = 'demo@vilnacrm.com';
const DEMO_LINK = 'Відкрити посилання з листа (демо)';

function Arrival(): JSX.Element {
  const { pathname, search } = useLocation();
  return <p>{`arrived ${pathname}${search}`}</p>;
}

const renderFor = (email: string): ReturnType<typeof render> => {
  const router = createMemoryRouter(
    [
      {
        path: '/password-recovery',
        element: (
          <main>
            <SandboxDemoResetLink email={email} />
          </main>
        ),
      },
      { path: '/password-reset', element: <Arrival /> },
    ],
    { initialEntries: ['/password-recovery'] }
  );
  return render(
    <I18nextProvider i18n={createRecoveryLocaleI18n('uk')}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
};

describe('SandboxDemoResetLink', () => {
  afterEach(() => jest.restoreAllMocks());

  it('links the demo e-mail to the reset page with the demo token', async () => {
    const view = renderFor(DEMO_EMAIL);

    const link = screen.getByRole('link', { name: DEMO_LINK });
    expect(link).toHaveAttribute('href', '/password-reset?token=sandbox-demo-reset-token');
    await expectNoA11yViolations(view.container);

    await userEvent.click(link);

    expect(
      await screen.findByText('arrived /password-reset?token=sandbox-demo-reset-token')
    ).toBeInTheDocument();
  });

  it('renders nothing for any other e-mail', () => {
    renderFor(buildEmail());

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders nothing when the sandbox demo is inactive', () => {
    jest.spyOn(sandboxDemoSessionProvider, 'resetTokenFor').mockReturnValue(null);

    renderFor(DEMO_EMAIL);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(sandboxDemoSessionProvider.resetTokenFor).toHaveBeenCalledWith(DEMO_EMAIL);
  });
});
