import '@testing-library/jest-dom';
import { isInaccessible, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DrawerHeader from '@/components/ui-navigation-drawer/drawer-header';
import renderShell from '@tests/unit/utils/render-shell';

describe('DrawerHeader', () => {
  it('holds one operable control, the Close menu button, focused on mount', () => {
    renderShell(<DrawerHeader onDismiss={jest.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus();
  });

  it('speaks uk', () => {
    renderShell(<DrawerHeader onDismiss={jest.fn()} />, { locale: 'uk' });

    expect(screen.getByRole('button', { name: 'Закрити меню' })).toBeInTheDocument();
  });

  it('keeps the logo, bell, list and avatar as aria-hidden copies, not links or buttons', () => {
    renderShell(<DrawerHeader onDismiss={jest.fn()} />);
    const [header, logo] = screen.getAllByRole('presentation', { hidden: true });
    const avatar = screen.getAllByRole('generic', { hidden: true }).at(-1) as HTMLElement;
    const hiddenGlyphs = header?.innerHTML.match(/<svg\b[^>]*\baria-hidden="true"/gu);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'shell-logo-mobile.svg');
    expect(logo).toHaveAttribute('aria-hidden', 'true');
    expect(isInaccessible(logo as HTMLElement)).toBe(true);
    expect(avatar).toHaveAttribute('aria-hidden', 'true');
    expect(isInaccessible(avatar)).toBe(true);
    expect(hiddenGlyphs).toHaveLength(4);
    expect(screen.queryByText(/\S/u)).not.toBeInTheDocument();
  });

  it('dismisses when the close button is activated, once', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    renderShell(<DrawerHeader onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it('dismisses when the header outside its controls is tapped', async () => {
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    renderShell(<DrawerHeader onDismiss={onDismiss} />);

    await user.click(screen.getByRole('presentation'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('is 56 px tall and gives the close button a 44 px target without a ripple', () => {
    const { container } = renderShell(<DrawerHeader onDismiss={jest.fn()} />);

    expect(screen.getByRole('presentation')).toHaveStyle({ height: '56px' });
    expect(screen.getByRole('button')).toHaveStyle({ width: '44px', height: '44px' });
    expect(container).not.toContainHTML('MuiTouchRipple');
  });

  it('puts the supplied avatar in the aria-hidden copy, outside the one operable control', () => {
    renderShell(<DrawerHeader onDismiss={jest.fn()} avatar={<span>ОП</span>} />);

    const copy = screen.getByText('ОП');

    expect(isInaccessible(copy)).toBe(true);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Close menu' })).not.toContainElement(copy);
    expect(screen.queryByRole('button', { name: /ОП/u })).not.toBeInTheDocument();
  });
});
