import '@testing-library/jest-dom';
import { isInaccessible, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import navigationItems from '@/components/ui-app-shell/navigation-items';
import UINavigationDrawer from '@/components/ui-navigation-drawer';
import renderShell from '@tests/unit/utils/render-shell';
import stubMotionPreference from '@tests/unit/utils/stub-motion-preference';

type DrawerProps = Parameters<typeof UINavigationDrawer>[0];

const DRAWER_ROLES = [
  'generic',
  'presentation',
  'img',
  'button',
  'link',
  'navigation',
  'list',
  'listitem',
  'heading',
] as const;

const renderDrawer = (props: Partial<DrawerProps> = {}): ReturnType<typeof renderShell> =>
  renderShell(
    <UINavigationDrawer
      open={props.open ?? true}
      id={props.id ?? 'drawer-id'}
      items={props.items ?? navigationItems}
      signOut={props.signOut ?? jest.fn()}
      onClose={props.onClose ?? jest.fn()}
      onNavigate={props.onNavigate ?? jest.fn()}
      avatar={props.avatar}
    />
  );

describe('UINavigationDrawer', () => {
  const viewport = window.innerHeight;

  beforeEach(() => {
    stubMotionPreference(true);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: viewport });
    screen.queryByRole('contentinfo', { hidden: true })?.remove();
  });

  it('paints the supplied avatar in the aria-hidden header copy', async () => {
    renderDrawer({ avatar: <span>ОП</span> });

    await screen.findByRole('dialog', { name: 'Main navigation' });

    expect(isInaccessible(screen.getByText('ОП'))).toBe(true);
  });

  it('keeps the scrolling panel out of the Tab order so Firefox adds no unnamed stop', async () => {
    renderDrawer();

    const dialog = await screen.findByRole('dialog', { name: 'Main navigation' });
    const nav = within(dialog).getByRole('navigation', { name: 'Main navigation' });
    const panels = within(dialog)
      .getAllByRole('generic')
      .filter((element) => element.getAttribute('tabindex') === '-1');

    expect(panels).toHaveLength(1);
    expect(panels[0]).toContainElement(nav);
    expect(panels[0]).not.toHaveAttribute('role');
    expect(panels[0]).not.toHaveAttribute('aria-label');
  });

  it('keeps the dialog out of the Tab order and gives nothing a positive tabindex', async () => {
    renderDrawer();

    const dialog = await screen.findByRole('dialog', { name: 'Main navigation' });
    const positive = DRAWER_ROLES.flatMap((role) =>
      within(dialog).queryAllByRole(role, { hidden: true })
    ).filter((element) => Number(element.getAttribute('tabindex')) > 0);

    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(positive).toEqual([]);
  });

  it('renders nothing while closed', () => {
    renderDrawer({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a modal dialog with the given id and the name Main navigation', async () => {
    renderDrawer({ id: 'my-drawer' });

    const dialog = await screen.findByRole('dialog', { name: 'Main navigation' });

    expect(dialog).toHaveAttribute('id', 'my-drawer');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('names the dialog in uk', async () => {
    stubMotionPreference(true);
    renderShell(
      <UINavigationDrawer
        open
        id="d"
        items={navigationItems}
        signOut={jest.fn()}
        onClose={jest.fn()}
        onNavigate={jest.fn()}
      />,
      { locale: 'uk' }
    );

    expect(await screen.findByRole('dialog', { name: 'Основна навігація' })).toBeInTheDocument();
  });

  it('asks to close on Escape', async () => {
    const onClose = jest.fn();
    renderDrawer({ onClose });
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks to close on the Close menu button', async () => {
    const onClose = jest.fn();
    renderDrawer({ onClose });
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close menu' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('asks to close on the full-viewport backdrop, which paints nothing itself', async () => {
    const onClose = jest.fn();
    renderDrawer({ onClose });
    await screen.findByRole('dialog');
    const backdrop = screen
      .getAllByRole('generic', { hidden: true })
      .find((box) => box.className.includes('MuiBackdrop-root')) as HTMLElement;

    expect(backdrop).toHaveClass('MuiBackdrop-invisible');
    expect(backdrop).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0)' });
    await userEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('paints the 5 % scrim behind the header and the panel, ending at the footer top', async () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 718 });
    const footer = document.body.appendChild(document.createElement('footer'));
    footer.getBoundingClientRect = (): DOMRect => ({ top: 678 }) as DOMRect;
    renderDrawer();
    const dialog = await screen.findByRole('dialog');
    const [scrim] = within(dialog).getAllByRole('generic', { hidden: true });

    expect(scrim).toHaveAttribute('aria-hidden', 'true');
    expect(scrim).toHaveStyle({
      position: 'absolute',
      top: '0px',
      bottom: '40px',
      pointerEvents: 'none',
      backgroundColor: 'rgba(54, 79, 93, 0.05)',
    });
    expect(within(dialog).getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('keeps the scrim on the whole viewport when no footer is in view', async () => {
    renderDrawer();
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getAllByRole('generic', { hidden: true })[0]).toHaveStyle({
      bottom: '0px',
    });
  });

  it('closes for navigation and signs out when Sign out is activated', async () => {
    const onNavigate = jest.fn();
    const onClose = jest.fn();
    const signOut = jest.fn();
    renderDrawer({ onNavigate, onClose, signOut });
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sizes the panel to the drawn 313 by 622 box under the 56 px header', async () => {
    renderDrawer();
    await screen.findByRole('dialog');

    const panel = screen
      .getAllByRole('generic', { hidden: true })
      .find((box) => box.style.transition.includes('transform')) as HTMLElement;

    expect(panel).toHaveStyle({ height: '622px', top: '56px', right: '0px' });
  });
});
