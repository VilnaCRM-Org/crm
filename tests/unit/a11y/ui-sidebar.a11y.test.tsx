import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import navigationItems from '@/components/ui-app-shell/navigation-items';
import UISidebar from '@/components/ui-sidebar';
import featureFlagService from '@/config/runtime/feature-flag-service';
import renderShell from '@tests/unit/utils/render-shell';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

describe('UISidebar a11y', () => {
  beforeEach(() => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['desktop', '/'],
    ['desktop', '/settings'],
    ['desktop', '/products'],
    ['tablet', '/'],
    ['tablet', '/settings/webhooks'],
  ] as const)('has no violation on the expanded %s sidebar at %s', async (layout, path) => {
    const { container } = renderShell(
      <main>
        <UISidebar layout={layout} items={navigationItems} signOut={jest.fn()} />
      </main>,
      { path, locale: 'uk' }
    );

    await expectNoA11yViolations(container);
  });

  it.each(['desktop', 'tablet'] as const)('has no violation on the %s rail', async (layout) => {
    const user = userEvent.setup();
    const { container } = renderShell(
      <main>
        <UISidebar layout={layout} items={navigationItems} signOut={jest.fn()} />
      </main>,
      { path: '/settings' }
    );

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    await expectNoA11yViolations(container);
  });

  it('has no violation while a rail tooltip is shown', async () => {
    const user = userEvent.setup();
    const { container } = renderShell(
      <main>
        <UISidebar layout="desktop" items={navigationItems} signOut={jest.fn()} />
      </main>
    );
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    await user.hover(screen.getByRole('link', { name: 'Contacts' }));

    await expectNoA11yViolations(container);
  });
});
