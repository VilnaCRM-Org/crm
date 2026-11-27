import '@testing-library/jest-dom';
import { isInaccessible, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import UIAppHeader from '@/components/ui-app-header';
import navigationItems from '@/components/ui-app-shell/navigation-items';
import { customColors } from '@/styles/colors';
import renderShell from '@tests/unit/utils/render-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

const LIVE_BELL = 'Live bell';

const liveBell = <button type="button">{LIVE_BELL}</button>;

const follows = (first: Node, second: Node): boolean =>
  first.compareDocumentPosition(second) === Node.DOCUMENT_POSITION_FOLLOWING;

jest.mock('@/assets/icons/shell/bell-01.svg', () => ({
  ReactComponent: ({
    className,
    'aria-hidden': hidden,
    focusable,
  }: {
    className?: string;
    'aria-hidden'?: 'true';
    focusable?: 'false';
  }): ReactElement => (
    <svg role="img" aria-hidden={hidden} focusable={focusable} className={className} />
  ),
}));

const bellCopyOf = (dialog: HTMLElement): HTMLElement => {
  const [bell] = within(dialog).getAllByRole('img', { hidden: true });
  if (bell === undefined) throw new Error('expected the drawn bell copy');

  return bell;
};

const innermostHolding = (...names: string[]): HTMLElement => {
  const holders = screen
    .getAllByRole('generic')
    .filter((box) => names.every((name) => within(box).queryByRole('button', { name }) !== null));
  const innermost = holders.at(-1);
  if (innermost === undefined) throw new Error(`expected a box holding ${names.join(', ')}`);

  return innermost;
};

const openDrawer = async (): Promise<HTMLElement> => {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Відкрити меню' }));

  return screen.findByRole('dialog', { name: 'Основна навігація' });
};

describe('UIAppHeader notifications slot', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'renders the slot and no disabled bell at %s',
    (layout) => {
      renderShell(<UIAppHeader layout={layout} notifications={liveBell} />, { locale: 'uk' });

      expect(screen.queryByRole('button', { name: 'Сповіщення' })).not.toBeInTheDocument();
      expect(screen.getAllByText('Ще недоступно')).toHaveLength(layout === 'mobile' ? 1 : 2);
      expect(screen.getByRole('button', { name: LIVE_BELL })).not.toHaveAccessibleDescription();
      expect(screen.getByRole('button', { name: LIVE_BELL })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Завдання' })).toBeDisabled();
    }
  );

  it.each(['desktop', 'tablet'] as const)(
    'keeps search, bell frame, tasks and the user frame in order at %s',
    (layout) => {
      renderShell(
        <UIAppHeader
          layout={layout}
          notifications={liveBell}
          userMenu={<button type="button">menu</button>}
        />,
        { locale: 'uk' }
      );
      const search = screen.getByRole('searchbox', { name: 'Пошук' });
      const bell = screen.getByRole('button', { name: LIVE_BELL });
      const tasks = screen.getByRole('button', { name: 'Завдання' });
      const menu = screen.getByRole('button', { name: 'menu' });

      expect(follows(search, bell)).toBe(true);
      expect(follows(bell, tasks)).toBe(true);
      expect(follows(tasks, menu)).toBe(true);
    }
  );

  it.each([
    ['desktop', '48px'],
    ['tablet', '52px'],
    ['mobile', '24px'],
  ] as const)('renders the slot inside the %s bell frame', (layout, size) => {
    renderShell(<UIAppHeader layout={layout} notifications={liveBell} />);
    const frame = innermostHolding(LIVE_BELL);

    expect(frame).toHaveStyle({ width: size, height: size, flexShrink: '0' });
    expect(within(frame).queryByRole('button', { name: 'Tasks' })).not.toBeInTheDocument();
    expect(innermostHolding(LIVE_BELL, 'Tasks')).not.toBe(frame);
  });

  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'keeps the cluster spacing unchanged at %s',
    (layout) => {
      const { unmount } = renderShell(<UIAppHeader layout={layout} notifications={liveBell} />);
      const spacing = (box: HTMLElement): string[] => {
        const style = getComputedStyle(box);

        return [style.gap, style.marginTop, style.marginLeft, style.width, style.alignItems];
      };
      const live = spacing(innermostHolding(LIVE_BELL, 'Tasks'));
      unmount();
      renderShell(<UIAppHeader layout={layout} />);

      expect(live).toEqual(spacing(innermostHolding('Notifications', 'Tasks')));
    }
  );

  it('keeps today’s disabled bell, described Ще недоступно, with no slot', () => {
    renderShell(<UIAppHeader layout="desktop" />, { locale: 'uk' });

    const bell = screen.getByRole('button', { name: 'Сповіщення' });

    expect(bell).toBeDisabled();
    expect(bell).toHaveAccessibleDescription('Ще недоступно');
  });

  describe('mobile drawer bell copy', () => {
    const navigation = { items: navigationItems, signOut: jest.fn() };

    beforeEach(() => {
      stubMotionPreference(true);
    });

    it('draws the bell copy in the enabled glyph colour with a slot', async () => {
      renderShell(
        <UIAppHeader layout="mobile" navigation={navigation} notifications={liveBell} />,
        { locale: 'uk' }
      );
      const dialog = await openDrawer();
      const bell = bellCopyOf(dialog);

      expect(bell).toHaveStyle({ color: customColors.text.dark });
      expect(bell).toHaveAttribute('aria-hidden', 'true');
      expect(isInaccessible(bell)).toBe(true);
    });

    it('keeps the disabled bell copy colour with no slot', async () => {
      renderShell(<UIAppHeader layout="mobile" navigation={navigation} />, { locale: 'uk' });
      const dialog = await openDrawer();

      expect(bellCopyOf(dialog)).toHaveStyle({ color: customColors.checkbox.main });
    });
  });
});
