import '@testing-library/jest-dom';
import { isInaccessible, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type JSX, useCallback } from 'react';
import { Route, Routes, useNavigate } from 'react-router';

import MobileNavigation from '@/components/ui-app-header/mobile-navigation';
import navigationItems from '@/components/ui-app-shell/navigation-items';
import featureFlagService from '@/config/runtime/feature-flag-service';
import useArrivalFocus from '@/hooks/use-arrival-focus';
import renderShell from '@tests/unit/utils/render-shell';
import ShellLocation from '@tests/unit/utils/shell-location';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

function Page({ signOut }: { signOut: () => void }): JSX.Element {
  const focusOnArrival = useArrivalFocus();
  const navigate = useNavigate();
  const goProducts = useCallback(() => navigate('/products'), [navigate]);

  return (
    <>
      <header>
        <MobileNavigation items={navigationItems} signOut={signOut} />
      </header>
      <main ref={focusOnArrival} tabIndex={-1}>
        <h1>Page</h1>
      </main>
      <footer>Footer</footer>
      <button type="button" onClick={goProducts}>
        go products
      </button>
      <ShellLocation />
    </>
  );
}

const renderNavigation = (
  path = '/',
  signOut: () => void = jest.fn()
): ReturnType<typeof renderShell> =>
  renderShell(
    <Routes>
      <Route path="*" element={<Page signOut={signOut} />} />
    </Routes>,
    { path }
  );

const open = async (): Promise<HTMLElement> => {
  await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));

  return screen.findByRole('dialog', { name: 'Main navigation' });
};

function Wide({ mobile }: { mobile: boolean }): JSX.Element {
  return (
    <>
      <header>{mobile && <MobileNavigation items={navigationItems} signOut={jest.fn()} />}</header>
      <main tabIndex={-1}>Page</main>
    </>
  );
}

const slidingPanel = (): HTMLElement =>
  screen
    .getAllByRole('generic', { hidden: true })
    .find((box) => box.style.transition.includes('transform')) as HTMLElement;

type FocusStep = readonly ['link' | 'button', string];

const expectFocusSequence = async (steps: readonly FocusStep[], shift = false): Promise<void> => {
  const [step, ...rest] = steps;
  if (step === undefined) return;
  await userEvent.tab({ shift });
  expect(screen.getByRole(step[0], { name: step[1] })).toHaveFocus();
  await expectFocusSequence(rest, shift);
};

describe('MobileNavigation', () => {
  beforeEach(() => {
    stubMotionPreference(true);
    jest.spyOn(featureFlagService, 'isEnabled').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('keeps the drawer unmounted while closed: no dialog, no close control, no navigation', () => {
    renderNavigation();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close menu' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens a modal named Main navigation, focuses Close menu and links the burger', async () => {
    renderNavigation();

    const dialog = await open();

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('button', { name: 'Close menu' })).toHaveFocus();
    const burger = screen.getByRole('button', { name: 'Open menu', hidden: true });
    expect(burger).toHaveAttribute('aria-expanded', 'true');
    expect(burger).toHaveAttribute('aria-controls', dialog.getAttribute('id'));
  });

  it('opens on Enter and Space from the burger', async () => {
    renderNavigation();

    screen.getByRole('button', { name: 'Open menu' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    screen.getByRole('button', { name: 'Open menu' }).focus();
    await userEvent.keyboard(' ');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('paints the given avatar in the drawer header copy', async () => {
    renderShell(
      <MobileNavigation items={navigationItems} signOut={jest.fn()} avatar={<span>ОП</span>} />
    );

    const dialog = await open();

    expect(isInaccessible(within(dialog).getByText('ОП'))).toBe(true);
  });

  it('holds the navigation list and a disabled search inside the dialog', async () => {
    renderNavigation();

    const dialog = await open();

    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(within(dialog).getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(
      within(dialog)
        .getAllByRole('link')
        .map((link) => link.textContent)
    ).toEqual(['Boards', 'Products', 'Orders', 'Contacts', 'Analytics', 'Settings']);
    expect(within(dialog).getByRole('searchbox', { name: 'Search' })).toBeDisabled();
  });

  it('cycles Tab through close, rows, chevron and Sign out, never reaching the page', async () => {
    renderNavigation('/settings');
    await open();

    await expectFocusSequence([
      ['link', 'Boards'],
      ['link', 'Products'],
      ['link', 'Orders'],
      ['link', 'Contacts'],
      ['link', 'Analytics'],
      ['link', 'Settings'],
      ['button', 'Collapse Settings'],
      ['link', 'Integrations'],
      ['link', 'Webhooks'],
      ['link', 'Billing'],
      ['button', 'Sign out'],
      ['button', 'Close menu'],
      ['link', 'Boards'],
    ]);
  });

  it('cycles Shift+Tab back from close through Sign out, sub-items, chevron and rows', async () => {
    renderNavigation('/settings');
    await open();

    await expectFocusSequence(
      [
        ['button', 'Sign out'],
        ['link', 'Billing'],
        ['link', 'Webhooks'],
        ['link', 'Integrations'],
        ['button', 'Collapse Settings'],
        ['link', 'Settings'],
        ['link', 'Analytics'],
        ['link', 'Contacts'],
        ['link', 'Orders'],
        ['link', 'Products'],
        ['link', 'Boards'],
        ['button', 'Close menu'],
        ['button', 'Sign out'],
      ],
      true
    );
    expect(screen.getByRole('main', { hidden: true })).not.toHaveFocus();
  });

  it('skips the sub-items in the Tab cycle while the Settings group is collapsed', async () => {
    renderNavigation('/');
    await open();

    await expectFocusSequence([
      ['link', 'Boards'],
      ['link', 'Products'],
      ['link', 'Orders'],
      ['link', 'Contacts'],
      ['link', 'Analytics'],
      ['link', 'Settings'],
      ['button', 'Expand Settings'],
      ['button', 'Sign out'],
      ['button', 'Close menu'],
    ]);
  });

  it('closes on Escape and returns focus to the burger', async () => {
    renderNavigation();
    await open();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const burger = screen.getByRole('button', { name: 'Open menu' });
    expect(burger).toHaveFocus();
    expect(burger).toHaveAttribute('aria-expanded', 'false');
    expect(burger).not.toHaveAttribute('aria-controls');
  });

  it('closes on the Close menu button and returns focus to the burger', async () => {
    renderNavigation();
    const dialog = await open();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close menu' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });

  it('closes on a tap on the scrim and returns focus to the burger', async () => {
    renderNavigation();
    await open();
    const scrim = screen
      .getAllByRole('generic', { hidden: true })
      .find((box) => box.className.includes('MuiBackdrop-root')) as HTMLElement;

    await userEvent.click(scrim);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });

  it('closes on a tap on the drawer header outside the panel, activating nothing', async () => {
    renderNavigation();
    const dialog = await open();
    const header = within(dialog)
      .getAllByRole('presentation', { hidden: true })
      .find(
        (box) => within(box).queryByRole('button', { name: 'Close menu' }) !== null
      ) as HTMLElement;

    await userEvent.click(header);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('location')).toHaveTextContent('/|null');
  });

  it('hides the page from assistive technology while open and exposes it again after', async () => {
    const { container } = renderNavigation();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();

    await open();

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(container).not.toHaveAttribute('aria-hidden');
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' });
  });

  it('closes without burger focus when Settings is activated and lands on main', async () => {
    renderNavigation('/');
    const dialog = await open();

    await userEvent.click(within(dialog).getByRole('link', { name: 'Settings' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('location')).toHaveTextContent('/settings|');
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('marks Settings current when the drawer opens on /settings', async () => {
    renderNavigation('/settings');

    const dialog = await open();

    expect(within(dialog).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('closes and focuses main when a product row or a sub-item is tapped', async () => {
    renderNavigation('/settings');
    const dialog = await open();

    await userEvent.click(within(dialog).getByRole('link', { name: 'Webhooks' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByLabelText('location')).toHaveTextContent('/settings/webhooks');
  });

  it('closes and signs out exactly once when Sign out is activated', async () => {
    const signOut = jest.fn();
    renderNavigation('/', signOut);
    const dialog = await open();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('closes without restoring focus to the burger when the route changes under it', async () => {
    renderNavigation('/');
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'go products', hidden: true }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Open menu' })).not.toHaveFocus();
  });

  it('moves focus to main when it unmounts while open, as when the viewport widens', async () => {
    const view = renderShell(<Wide mobile />);
    await open();

    view.rerender(<Wide mobile={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('slides in 200 ms by default and in 0 ms under reduced motion', async () => {
    stubMotionPreference(false);
    const view = renderNavigation();
    await open();

    expect(slidingPanel().style.transition).toContain('200ms');
    view.unmount();

    stubMotionPreference(true);
    renderNavigation();
    await open();

    expect(slidingPanel().style.transition).toContain('0ms');
    expect(slidingPanel().style.transition).not.toContain('200ms');
  });

  it('renders no MUI ripple in the burger, the close button or the rows', async () => {
    renderNavigation();
    await open();

    expect(document.body).not.toContainHTML('MuiTouchRipple');
  });
});
