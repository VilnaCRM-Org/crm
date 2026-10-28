import '@testing-library/jest-dom';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';

import UserMenu from '@/modules/user/features/settings/components/user-menu';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';
import stubLiveViewportWidth from '@tests/unit/utils/stub-live-viewport-width';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';

const identity = { displayName: 'Євгенія Маслова', monogram: 'ЄМ' };

type MenuProps = Parameters<typeof UserMenu>[0];

const renderMenu = (props: Partial<MenuProps> = {}, path = '/'): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <UserMenu
              identity={props.identity === undefined ? identity : props.identity}
              settingsAvailable={props.settingsAvailable ?? true}
              signOut={props.signOut ?? jest.fn()}
            />
            <button type="button">after</button>
            <ShellLocation />
          </>
        }
      />
    </Routes>,
    { path, locale: 'uk' }
  );

const chip = (): HTMLElement => screen.getByRole('button', { name: /Меню користувача/u });

describe('UserMenu', () => {
  beforeEach(() => {
    stubViewportWidth(1440);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('is a menu button named by the visible display name followed by User menu', () => {
    renderMenu();

    expect(chip()).toHaveAttribute('aria-haspopup', 'menu');
    expect(chip()).toHaveAttribute('aria-expanded', 'false');
    expect(chip()).toHaveAccessibleName('Євгенія Маслова, Меню користувача');
    expect(chip()).toHaveTextContent('ЄМЄвгенія Маслова');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('is name-less while the identity is unknown: the person glyph and the bare name', () => {
    renderMenu({ identity: null });

    expect(chip()).toHaveAccessibleName('Меню користувача');
    expect(chip()).toHaveTextContent(/^$/u);
  });

  it('truncates a long name inside the 121 px box and keeps it in the accessible name', () => {
    renderMenu({ identity: { displayName: 'Олександр Дуже-Довгопрізвищенко', monogram: 'ОД' } });

    expect(screen.getByText('Олександр Дуже-Довгопрізвищенко')).toHaveStyle({
      minWidth: '121px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
    expect(chip()).toHaveAccessibleName('Олександр Дуже-Довгопрізвищенко, Меню користувача');
  });

  it.each([
    ['click', ''],
    ['Enter', '{Enter}'],
    ['Space', ' '],
    ['ArrowDown', '{ArrowDown}'],
  ])('opens the menu on %s, focuses the first item and reports expanded', async (_name, keys) => {
    const user = userEvent.setup();
    renderMenu();

    if (keys === '') await user.click(chip());
    else {
      chip().focus();
      await user.keyboard(keys);
    }

    const menu = screen.getByRole('menu');
    expect(chip()).toHaveAttribute('aria-expanded', 'true');
    expect(chip()).toHaveAttribute('aria-controls', menu.getAttribute('id'));
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((item) => item.textContent)
    ).toEqual(['Мій профіль', 'Налаштування', 'Вийти']);
    expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus();
  });

  it('holds only Sign out while settings are unavailable', async () => {
    const user = userEvent.setup();
    renderMenu({ settingsAvailable: false });

    await user.click(chip());

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Вийти']);
  });

  it('moves focus with ArrowDown, ArrowUp, Home and End, wrapping at both ends', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());
    const [profile, settings, signOut] = screen.getAllByRole('menuitem');

    await user.keyboard('{ArrowDown}');
    expect(settings).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(signOut).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(profile).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(signOut).toHaveFocus();
    await user.keyboard('{Home}');
    expect(profile).toHaveFocus();
    await user.keyboard('{End}');
    expect(signOut).toHaveFocus();
  });

  it('closes on Escape and returns focus to the chip', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(chip()).toHaveFocus();
    expect(chip()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Tab and continues in reading order, with no focus trap', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());

    await user.tab();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });

  it('closes on a click outside without moving focus to the clicked control', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());
    const scrim = screen
      .getAllByRole('generic', { hidden: true })
      .find(
        (box) => box.getAttribute('aria-hidden') === 'true' && box.textContent === ''
      ) as HTMLElement;

    await user.click(scrim);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'after' })).not.toHaveFocus();
  });

  it('toggles closed when the chip is activated again', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());

    await user.click(chip());

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(chip()).toHaveFocus();
  });

  it.each(['Мій профіль', 'Налаштування'])(
    'navigates to /settings with state.focusMain and closes when %s is activated',
    async (label) => {
      const user = userEvent.setup();
      renderMenu({}, '/boards');
      await user.click(chip());

      await user.click(screen.getByRole('menuitem', { name: label }));

      expect(screen.getByLabelText('location')).toHaveTextContent('/settings|{"focusMain":true}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    }
  );

  it('links My profile and Settings to /settings', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());

    expect(screen.getByRole('menuitem', { name: 'Мій профіль' })).toHaveAttribute(
      'href',
      '/settings'
    );
    expect(screen.getByRole('menuitem', { name: 'Налаштування' })).toHaveAttribute(
      'href',
      '/settings'
    );
  });

  it('navigates again when Settings is activated while on /settings', async () => {
    const user = userEvent.setup();
    renderMenu({}, '/settings');
    await user.click(chip());

    await user.click(screen.getByRole('menuitem', { name: 'Налаштування' }));

    expect(screen.getByLabelText('location')).toHaveTextContent('/settings|{"focusMain":true}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes and hands each Sign out to signOut, which owns the re-entry latch', async () => {
    const user = userEvent.setup();
    const signOut = jest.fn();
    renderMenu({ signOut });
    await user.click(chip());

    await user.click(screen.getByRole('menuitem', { name: 'Вийти' }));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(chip());
    await user.click(screen.getByRole('menuitem', { name: 'Вийти' }));

    expect(signOut).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('draws the card at 225 px wide with the open shadow and the three 44 px items', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());

    screen.getAllByRole('menuitem').forEach((item) => expect(item).toHaveStyle({ height: '44px' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it.each([
    ['tablet', 1100, '60px'],
    ['mobile', 375, '44px'],
  ] as const)('sizes the %s items to %s', async (_layout, width, height) => {
    stubViewportWidth(width);
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());

    screen.getAllByRole('menuitem').forEach((item) => expect(item).toHaveStyle({ height }));
  });

  it('is an icon-only 44 px avatar on mobile with the monogram hidden', () => {
    stubViewportWidth(375);
    renderMenu();

    expect(chip()).toHaveAccessibleName('Євгенія Маслова, Меню користувача');
    expect(chip()).toHaveStyle({ width: '44px', height: '44px' });
    expect(screen.queryByText('Євгенія Маслова')).not.toBeInTheDocument();
    expect(screen.getByText('ЄМ')).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens a detached popover on mobile with the same three items', async () => {
    stubViewportWidth(375);
    const user = userEvent.setup();
    renderMenu();

    await user.click(chip());

    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
  });

  it('renders no MUI ripple in the chip or any item', async () => {
    const user = userEvent.setup();
    const { container } = renderMenu();
    await user.click(chip());
    await user.click(screen.getByRole('menuitem', { name: 'Налаштування' }));

    expect(container).not.toContainHTML('MuiTouchRipple');
  });

  it('shows the person glyph instead of letters for an empty monogram', () => {
    renderMenu({ identity: { displayName: '', monogram: '' } });

    expect(chip()).toHaveTextContent(/^$/u);
  });

  it('publishes an aria-hidden copy of its own avatar through onAvatar', () => {
    const onAvatar = jest.fn();
    stubViewportWidth(375);
    renderShell(
      <UserMenu identity={identity} settingsAvailable signOut={jest.fn()} onAvatar={onAvatar} />,
      { locale: 'uk' }
    );

    expect(onAvatar).toHaveBeenCalledTimes(1);
    renderShell(<>{onAvatar.mock.calls[0]?.[0]}</>);
    const copies = screen.getAllByText('ЄМ');
    expect(copies).toHaveLength(2);
    expect(copies[1]).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: /Меню користувача/u })).not.toContainElement(
      copies[1] ?? null
    );
  });

  it.each([
    [1440, 375],
    [375, 1440],
  ])('keeps the focused chip button across a %i to %i px layout change', (from, to) => {
    const viewport = stubLiveViewportWidth(from);
    renderMenu();
    const button = chip();
    act(() => button.focus());

    viewport.resize(to);

    expect(chip()).toBe(button);
    expect(button).toHaveFocus();
  });

  it.each([
    [1440, 375],
    [375, 1440],
  ])(
    'closes the menu and returns focus to the chip when a %i to %i px change drops it',
    async (from, to) => {
      const viewport = stubLiveViewportWidth(from);
      const user = userEvent.setup();
      renderMenu();
      await user.click(chip());
      expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();

      viewport.resize(to);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(chip()).toHaveAttribute('aria-expanded', 'false');
      expect(chip()).toHaveFocus();
    }
  );

  it('leaves focus alone when a layout change closes a menu that no longer holds it', async () => {
    const viewport = stubLiveViewportWidth(1440);
    const user = userEvent.setup();
    renderMenu();
    await user.click(chip());
    const after = screen.getByRole('button', { name: 'after', hidden: true });
    act(() => after.focus());

    viewport.resize(375);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(after).toHaveFocus();
  });

  it('does not move focus to the closed chip on a layout change', () => {
    const viewport = stubLiveViewportWidth(1440);
    renderMenu();

    viewport.resize(375);

    expect(document.body).toHaveFocus();
  });
});
