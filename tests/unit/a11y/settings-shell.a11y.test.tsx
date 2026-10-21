import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import UserProfile from '@/modules/user/features/settings/routes/user-profile';
import createSettingsLocaleI18n from '@tests/unit/utils/create-settings-locale-i18n';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@/modules/user/features/settings/hooks/use-profile-load', () => ({
  __esModule: true,
  default: (): object => ({
    status: 'loading',
    user: null,
    version: 0,
    refocus: false,
    retry: (): undefined => undefined,
    adoption: {
      adopt: (): undefined => undefined,
      confirm: (): undefined => undefined,
      isCurrent: (): boolean => true,
    },
  }),
}));

describe('settings page shell accessibility', () => {
  it('has no axe violations inside the main landmark AppLayout provides', async () => {
    const view = render(
      <I18nextProvider i18n={createSettingsLocaleI18n('uk')}>
        <main>
          <UserProfile />
        </main>
      </I18nextProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    await expectNoA11yViolations(view.container);
  });
});
