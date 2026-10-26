import 'reflect-metadata';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ComingSoonPage from '@/components/coming-soon';
import featureFlagService from '@/config/runtime/feature-flag-service';
import renderAppShell from '@tests/unit/utils/render-app-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';
import { A11Y_EXCEPTIONS } from '@tests/utils/a11y/axe-config';

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

const selectorOf = (fragment: string): string => {
  const entry = A11Y_EXCEPTIONS.find(({ selector }) => selector.includes(fragment));
  if (entry === undefined) throw new Error(`no exception selector contains ${fragment}`);
  return entry.selector;
};

const FOOTER = selectorOf('footer a.MuiLink-root');
const ACTIONS = selectorOf('#error-page-actions > .MuiButton-contained');
const DIGITS = selectorOf('#error-page-digits');
const CURRENT = selectorOf('aria-current');

const COMING_SOON = ['/boards', '/products', '/orders', '/contacts', '/analytics'] as const;

const matching = (root: HTMLElement, selector: string): HTMLElement[] =>
  ['link', 'generic', 'paragraph', 'button']
    .flatMap((role) => within(root).queryAllByRole(role, { hidden: true }))
    .filter((element) => element.matches(selector));

describe('the exception allowlist against the assembled shell (issue #362)', () => {
  beforeEach(() => {
    stubMotionPreference(false);
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('matches no banner or navigation element with the footer-scoped entry', async () => {
    await renderAppShell({ path: '/settings', width: 1440, page: <h1>Налаштування</h1> });

    expect(matching(screen.getByRole('banner'), FOOTER)).toHaveLength(0);
    expect(
      matching(screen.getByRole('navigation', { name: 'Основна навігація' }), FOOTER)
    ).toHaveLength(0);
    expect(matching(screen.getByRole('contentinfo'), FOOTER).length).toBeGreaterThan(0);
  });

  it('matches no element of the open drawer with the footer-scoped entry', async () => {
    await renderAppShell({ path: '/settings', width: 375, page: <h1>Налаштування</h1> });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Відкрити меню' }));
    const dialog = await screen.findByRole('dialog', { name: 'Основна навігація' });

    expect(matching(dialog, FOOTER)).toHaveLength(0);
  });

  it.each(COMING_SOON)(
    'matches only the home link on %s with the actions entry, and no digits',
    async (path) => {
      const { container } = await renderAppShell({
        path,
        width: 1440,
        page: <ComingSoonPage />,
      });
      const main = screen.getByRole('main');
      const home = within(main).getByRole('link', { name: 'На головну сторінку' });

      expect(matching(container, ACTIONS)).toEqual([home]);
      expect(matching(container, DIGITS)).toHaveLength(0);
    }
  );

  it('matches the current navigation row only, not the other rows or the banner', async () => {
    await renderAppShell({ path: '/boards', width: 1440, page: <ComingSoonPage /> });
    const nav = screen.getByRole('navigation', { name: 'Основна навігація' });
    const boards = within(nav).getByRole('link', { name: 'Дошки' });

    expect(matching(nav, CURRENT)).toEqual([boards]);
    expect(boards).toHaveAttribute('aria-current', 'page');
    expect(matching(screen.getByRole('banner'), CURRENT)).toHaveLength(0);
  });

  it('matches the label box of a current group header, and no other label box', () => {
    render(
      <div>
        <nav>
          <a href="/settings" aria-current="page">
            <span>Current group</span>
          </a>
          <a href="/boards">
            <span>Other group</span>
          </a>
        </nav>
        <div role="dialog">
          <a href="/settings" aria-current="page">
            <span>Drawer group</span>
          </a>
        </div>
        <footer>
          <a href="/x" aria-current="page">
            <span>Outside the navigation</span>
          </a>
        </footer>
      </div>
    );
    const labelled = ['Current group', 'Other group', 'Drawer group', 'Outside the navigation'];

    expect(labelled.filter((text) => screen.getByText(text).matches(CURRENT))).toEqual([
      'Current group',
      'Drawer group',
    ]);
  });

  it('matches the current row inside the open drawer too', async () => {
    await renderAppShell({ path: '/boards', width: 375, page: <ComingSoonPage /> });

    await userEvent.setup().click(screen.getByRole('button', { name: 'Відкрити меню' }));
    const dialog = await screen.findByRole('dialog', { name: 'Основна навігація' });

    expect(matching(dialog, CURRENT)).toEqual([
      within(dialog).getByRole('link', { name: 'Дошки' }),
    ]);
  });
});
