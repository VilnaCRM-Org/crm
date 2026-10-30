import 'reflect-metadata';
import '@testing-library/jest-dom';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import featureFlagService from '@/config/runtime/feature-flag-service';
import renderAppShell from '@tests/unit/utils/render-app-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import expectNoA11yViolations from '@tests/utils/a11y/expect-no-a11y-violations';

jest.mock('@/providers/di', () => {
  const Mapper = jest.requireActual('@/modules/user/store/user-display-name-mapper').default;
  const tokens = jest.requireActual('@/modules/user/config/tokens').default;
  const mapper = new Mapper();
  const provider = { read: (): Promise<never> => new Promise(() => undefined) };

  return {
    __esModule: true,
    useService: (token: symbol): unknown => (token === tokens.ProfileProvider ? provider : mapper),
  };
});

const DESKTOP = 1440;
const MOBILE = 375;
const HOME = <h1>Головна</h1>;
const NAV_NAME = 'Основна навігація';
const UNAVAILABLE = 'Ще недоступно';

describe('the assembled app shell accessibility (issue #362)', () => {
  beforeEach(() => {
    stubMotionPreference(false);
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each(['/', '/settings'])('has no axe violation inside AppLayout on %s', async (path) => {
    const { container } = await renderAppShell({ path, width: DESKTOP, page: HOME });

    await expectNoA11yViolations(container);
  });

  it('has no axe violation at the tablet and mobile layouts', async () => {
    const { container, unmount } = await renderAppShell({
      path: '/',
      width: 1024,
      page: HOME,
    });
    await expectNoA11yViolations(container);
    unmount();
    const { container: mobileContainer } = await renderAppShell({
      path: '/',
      width: MOBILE,
      page: HOME,
    });

    await expectNoA11yViolations(mobileContainer);
  });

  it('counts one banner, one navigation, one main and one contentinfo at 1440', async () => {
    await renderAppShell({ path: '/', width: DESKTOP, page: HOME });

    expect(screen.getAllByRole('banner')).toHaveLength(1);
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: NAV_NAME })).toBeInTheDocument();
  });

  it('shares the name Main navigation between the open drawer and its nav', async () => {
    await renderAppShell({ path: '/settings', width: MOBILE, page: HOME });
    const user = userEvent.setup();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Відкрити меню' }));
    const dialog = await screen.findByRole('dialog', { name: NAV_NAME });

    expect(within(dialog).getByRole('navigation', { name: NAV_NAME })).toBeInTheDocument();
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('has no axe violation with the drawer open on /settings', async () => {
    await renderAppShell({ path: '/settings', width: MOBILE, page: HOME });
    const burger = screen.getByRole('button', { name: 'Відкрити меню' });

    await userEvent.setup().click(burger);
    await screen.findByRole('dialog', { name: NAV_NAME });

    expect(burger).toHaveAttribute('aria-expanded', 'true');
    expect(burger).toHaveAttribute('aria-haspopup', 'dialog');
    await expectNoA11yViolations(document.body);
  });

  it('has no axe violation with the user menu open, and names the menu and its items', async () => {
    await renderAppShell({ path: '/', width: DESKTOP, page: HOME });
    const chip = await screen.findByRole('button', { name: 'Меню користувача' });

    await userEvent.setup().click(chip);
    const menu = await screen.findByRole('menu');

    expect(chip).toHaveAttribute('aria-haspopup', 'menu');
    expect(chip).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
    await expectNoA11yViolations(document.body);
  });

  it('describes the disabled search, bell and list as unavailable, off the tab order', async () => {
    await renderAppShell({ path: '/', width: DESKTOP, page: HOME });
    const search = screen.getByRole('searchbox', { name: 'Пошук' });
    const bell = screen.getByRole('button', { name: 'Сповіщення' });
    const tasks = screen.getByRole('button', { name: 'Завдання' });
    const controls = [search, bell, tasks];
    const user = userEvent.setup();

    for (const control of controls) {
      expect(control).toBeDisabled();
      expect(control).toHaveAccessibleDescription(UNAVAILABLE);
      expect(control).not.toHaveAttribute('aria-live');
      expect(control).not.toHaveAttribute('role', 'status');
    }
    expect(screen.queryAllByRole('status')).toHaveLength(0);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
    for (let step = 0; step < 30; step += 1) {
      await user.tab();
      for (const control of controls) expect(control).not.toHaveFocus();
    }
  });

  it('keeps every row and sub-item a plain link, with no unavailable status', async () => {
    await renderAppShell({ path: '/settings', width: DESKTOP, page: HOME });
    const nav = screen.getByRole('navigation', { name: NAV_NAME });
    const links = within(nav).getAllByRole('link');

    expect(links.length).toBeGreaterThanOrEqual(9);
    for (const link of links) {
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAccessibleDescription('');
      expect(link).not.toHaveTextContent(UNAVAILABLE);
    }
  });
});
