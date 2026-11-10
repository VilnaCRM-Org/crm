import '@testing-library/jest-dom';
import { act, screen, within } from '@testing-library/react';

import ComingSoonPage from '@/components/coming-soon';
import comingSoonEn from '@/components/coming-soon/i18n/en.json';
import comingSoonUk from '@/components/coming-soon/i18n/uk.json';
import appShellEn from '@/components/ui-app-shell/i18n/en.json';
import appShellUk from '@/components/ui-app-shell/i18n/uk.json';
import currentUserSource from '@/modules/user/features/settings/utils/current-user-source';
import renderAppShell from '@tests/unit/utils/render-app-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

const expectContactsIn = (shell: typeof appShellEn, page: typeof comingSoonEn): void => {
  const label = shell.app_shell.items.contacts;
  const heading = page.coming_soon.sections.contacts;
  const nav = screen.getByRole('navigation', { name: shell.app_shell.navigation.label });

  expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  expect(screen.getByText(page.coming_soon.message)).toBeInTheDocument();
  expect(document.title).toBe(`${heading} - VilnaCRM`);
};

describe('a locale switch in the assembled shell (FR-7.4 E)', () => {
  beforeEach(() => {
    stubMotionPreference(false);
    jest.spyOn(currentUserSource, 'read').mockReturnValue(new Promise(() => undefined));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('changes the row label, heading, message and document title together', async () => {
    const { i18n } = await renderAppShell({
      path: '/contacts',
      width: 1440,
      page: <ComingSoonPage />,
    });
    expectContactsIn(appShellUk, comingSoonUk);

    await act(() => i18n.changeLanguage('en'));
    expectContactsIn(appShellEn, comingSoonEn);

    await act(() => i18n.changeLanguage('uk'));
    expectContactsIn(appShellUk, comingSoonUk);
  });
});
