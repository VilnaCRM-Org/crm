import '@testing-library/jest-dom';
import { act, fireEvent, isInaccessible, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';

import UIAppShell from '@/components/ui-app-shell';
import featureFlagService from '@/config/runtime/feature-flag-service';
import type { UserMenuSlot } from '@/routes/types/shell-slot';
import renderShell from '@tests/unit/utils/render-shell';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';

const AvatarMenu: UserMenuSlot = ({ onAvatar }) => {
  useEffect(() => {
    onAvatar(<span>ОП</span>);
  }, [onAvatar]);

  return <span>chip</span>;
};

const SIDEBAR_ROWS = ['Boards', 'Products', 'Orders', 'Contacts', 'Analytics', 'Settings'];

const openDrawer = async (): Promise<HTMLElement> => {
  await userEvent.setup().click(screen.getByRole('button', { name: 'Open menu' }));

  return screen.findByRole('dialog', { name: 'Main navigation' });
};

const Menu: UserMenuSlot = ({ signOut }) => (
  <button type="button" onClick={signOut}>
    chip
  </button>
);

const renderAt = (width: number, userMenu?: UserMenuSlot, signOut = jest.fn()): void => {
  stubViewportWidth(width);
  renderShell(<UIAppShell signOut={signOut} userMenu={userMenu} />);
};

describe('UIAppShell', () => {
  beforeEach(() => {
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it.each([1440, 1920])('renders the banner and the sidebar at %i px', (width) => {
    renderAt(width);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('renders the banner and the sidebar at 1024 px, the tablet layout', () => {
    renderAt(1024);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it.each([320, 1023])('renders the banner and the burger but no sidebar at %i px', (width) => {
    renderAt(width);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('lists the five product rows and Settings in the sidebar, in order', () => {
    renderAt(1440);

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });

    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(SIDEBAR_ROWS);
  });

  it('puts the banner before the navigation in the DOM', () => {
    renderAt(1440);

    expect(
      screen
        .getByRole('banner')
        .compareDocumentPosition(screen.getByRole('navigation', { name: 'Main navigation' }))
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders the user menu slot inside the banner with the sign out handler', () => {
    const signOut = jest.fn();
    renderAt(1440, Menu, signOut);

    const chip = within(screen.getByRole('banner')).getByRole('button', { name: 'chip' });
    act(() => chip.click());

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('leaves the slot frame empty without a user menu', () => {
    renderAt(1440);

    expect(
      within(screen.getByRole('banner')).queryByRole('button', { name: 'chip' })
    ).not.toBeInTheDocument();
  });

  it('signs out once from the sidebar sign out control', async () => {
    const signOut = jest.fn();
    renderAt(1440, undefined, signOut);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('opens the drawer with the same items from the burger below the breakpoint', async () => {
    renderAt(375);

    const dialog = await openDrawer();

    expect(
      within(dialog)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(SIDEBAR_ROWS);
    expect(within(dialog).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('paints the avatar the user menu slot publishes in the drawer header copy', async () => {
    renderAt(375, AvatarMenu);

    const dialog = await openDrawer();
    const copy = within(dialog).getByText('ОП');

    expect(isInaccessible(copy)).toBe(true);
    within(dialog)
      .getAllByRole('button')
      .forEach((button) => expect(button).not.toContainElement(copy));
  });

  it('keeps the no-data placeholder in the drawer header without a user menu slot', async () => {
    renderAt(375);

    const dialog = await openDrawer();

    expect(dialog).toContainHTML('PersonOutlinedIcon');
    expect(within(dialog).queryByText('ОП')).not.toBeInTheDocument();
  });

  it('scrolls a sidebar control the sticky header covers back below it on focus', () => {
    const scrollBy = jest.fn();
    Object.defineProperty(window, 'scrollBy', { configurable: true, value: scrollBy });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: jest.fn(),
    });
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);

      return 1;
    });
    renderAt(1440);
    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });
    jest.spyOn(handle, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 36, 24, 24));

    fireEvent.focus(handle);

    expect(scrollBy).toHaveBeenCalledWith({ top: -28 });
    Reflect.deleteProperty(window, 'scrollBy');
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });
});
