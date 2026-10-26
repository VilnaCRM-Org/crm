import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UserMenuCard from '@/modules/user/features/settings/components/user-menu/user-menu-card';

const chip = <button type="button">chip</button>;
const items = <ul role="menu">items</ul>;

describe('UserMenuCard', () => {
  it.each([
    ['desktop', '225px'],
    ['tablet', '253px'],
  ] as const)('grows the %s chip in place into a card %s wide', (layout, width) => {
    render(<UserMenuCard layout={layout} open chip={chip} items={items} />);

    expect(screen.getAllByRole('generic', { hidden: true })[1]).toHaveStyle({
      width,
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
    expect(screen.getAllByRole('generic', { hidden: true })[1]).toHaveStyle({
      width: '225px',
      top: '45px',
      right: '-45px',
    });
  });
});
