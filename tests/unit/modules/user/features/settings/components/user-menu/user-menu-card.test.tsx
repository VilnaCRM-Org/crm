import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UserMenuCard from '@/modules/user/features/settings/components/user-menu/user-menu-card';

const chip = <button type="button">chip</button>;
const items = <ul role="menu">items</ul>;

describe('UserMenuCard', () => {
  it.each([
    ['desktop', '225px'],
    ['tablet', '253px'],
  ] as const)('grows the %s chip in place into a card at least %s wide', (layout, minWidth) => {
    render(<UserMenuCard layout={layout} open chip={chip} items={items} />);

    expect(screen.getAllByRole('generic', { hidden: true })[1]).toHaveStyle({
      position: 'relative',
      minWidth,
      border: '1px solid #D0D4D8',
      borderRadius: '8px',
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('draws no menu and no shadow while closed', () => {
    render(<UserMenuCard layout="desktop" open={false} chip={chip} items={items} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getAllByRole('generic', { hidden: true })[1]).not.toHaveStyle({
      boxShadow: '0 8px 27px rgba(49, 59, 67, 0.05)',
    });
  });

  it('draws the card shadow while open', () => {
    render(<UserMenuCard layout="desktop" open chip={chip} items={items} />);

    expect(screen.getAllByRole('generic', { hidden: true })[1]).toHaveStyle({
      boxShadow: '0 8px 27px rgba(49, 59, 67, 0.05)',
    });
  });

  it('renders the chip alone on mobile while closed', () => {
    render(<UserMenuCard layout="mobile" open={false} chip={chip} items={items} />);

    expect(screen.getByRole('button', { name: 'chip' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens a detached 225 px popover with a caret beside the chip on mobile', () => {
    render(<UserMenuCard layout="mobile" open chip={chip} items={items} />);

    expect(screen.getByRole('button', { name: 'chip' })).toBeInTheDocument();
    const [, , popover, caret, body] = screen.getAllByRole('generic', { hidden: true });
    expect(popover).toHaveStyle({ width: '225px', top: '45px', right: '-45px' });
    expect(caret).toHaveStyle({ marginLeft: '148px', width: '26px', height: '6px' });
    expect(body).toContainElement(screen.getByRole('menu'));
    expect(body).toHaveStyle({ borderRadius: '8px', overflow: 'hidden' });
  });

  it.each([
    ['desktop', 'mobile'],
    ['mobile', 'tablet'],
  ] as const)('keeps the chip element when the layout moves from %s to %s', (from, to) => {
    const view = render(<UserMenuCard layout={from} open={false} chip={chip} items={items} />);
    const button = screen.getByRole('button', { name: 'chip' });

    view.rerender(<UserMenuCard layout={to} open={false} chip={chip} items={items} />);

    expect(screen.getByRole('button', { name: 'chip' })).toBe(button);
  });

  it('wraps the mobile chip in a box that draws nothing of its own', () => {
    render(<UserMenuCard layout="mobile" open={false} chip={chip} items={items} />);

    const [, wrapper] = screen.getAllByRole('generic', { hidden: true });

    expect(wrapper).toContainElement(screen.getByRole('button', { name: 'chip' }));
    expect(wrapper).toHaveStyle({ display: 'contents' });
  });
});
