import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import SocialSignInPendingView from '@auth/components/social-sign-in-pending-view';
import createLocaleI18n from '@tests/unit/utils/create-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

const i18n = createLocaleI18n('uk');

const renderView = (providerLabel: string): ReturnType<typeof render> =>
  render(
    <I18nextProvider i18n={i18n}>
      <main>
        <SocialSignInPendingView providerLabel={providerLabel} />
      </main>
    </I18nextProvider>
  );

describe('SocialSignInPendingView', () => {
  it('shows a visible heading that names the provider and does not take focus', () => {
    renderView('GitHub');

    const heading = screen.getByRole('heading', { level: 1, name: 'Виконуємо вхід через GitHub…' });
    expect(heading).not.toHaveFocus();
  });

  it('styles the heading as the auth form title', () => {
    renderView('Google');

    expect(screen.getByRole('heading', { level: 1 })).toHaveStyle({
      fontSize: '1.375rem',
      fontWeight: '700',
    });
  });

  it('announces the same message politely once the spinner shows', async () => {
    renderView('Google');

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Виконуємо вхід через Google…')
    );
  });

  it('has no axe violations once the deferred spinner shows', async () => {
    const { container } = renderView('Google');
    await screen.findByRole('status');
    await waitFor(() => expect(screen.getByRole('status')).not.toBeEmptyDOMElement());

    await expectNoA11yViolations(container);
  });
});
