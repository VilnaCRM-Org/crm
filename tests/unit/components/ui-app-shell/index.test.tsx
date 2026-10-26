import '@testing-library/jest-dom';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UIAppShell from '@/components/ui-app-shell';
import featureFlagService from '@/config/runtime/feature-flag-service';
import type { UserMenuSlot } from '@/routes/types/shell-slot';
import renderShell from '@tests/unit/utils/render-shell';
import stubViewportWidth from '@tests/unit/utils/stub-viewport-width';

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
    ).toEqual(expect.arrayContaining(['Boards', 'Products', 'Orders', 'Contacts', 'Analytics']));
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

    await userEvent.setup().click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('dialog', { name: 'Main navigation' })).toBeInTheDocument();
  });
});
