import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UIAppHeader from '@/components/ui-app-header';
import navigationItems from '@/components/ui-app-shell/navigation-items';
import featureFlagService from '@/config/runtime/feature-flag-service';
import renderShell from '@tests/unit/utils/render-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('UINavigationDrawer a11y', () => {
  beforeEach(() => {
    stubMotionPreference(true);
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each(['/', '/settings'])('has no violation with the drawer open at %s', async (path) => {
    renderShell(
      <main>
        <UIAppHeader layout="mobile" navigation={{ items: navigationItems, signOut: jest.fn() }} />
      </main>,
      { path, locale: 'uk' }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Відкрити меню' }));
    await screen.findByRole('dialog', { name: 'Основна навігація' });

    await expectNoA11yViolations(document.body);
  });

  it('has no violation with the drawer closed', async () => {
    const { container } = renderShell(
      <main>
        <UIAppHeader layout="mobile" navigation={{ items: navigationItems, signOut: jest.fn() }} />
      </main>
    );

    await expectNoA11yViolations(container);
  });
});
