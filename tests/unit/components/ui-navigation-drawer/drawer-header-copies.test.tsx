import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import DrawerHeaderCopies from '@/components/ui-navigation-drawer/drawer-header-copies';

describe('DrawerHeaderCopies', () => {
  it('renders the bell, the list and the avatar as aria-hidden, non-interactive copies', () => {
    const { container } = render(<DrawerHeaderCopies />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('generic')).toHaveLength(1);
    expect(container).toContainHTML('aria-hidden="true"');
  });

  it('draws a 40 px avatar copy', () => {
    render(<DrawerHeaderCopies />);

    expect(screen.getAllByRole('generic', { hidden: true }).at(-1)).toHaveStyle({
      width: '40px',
      height: '40px',
    });
  });
});
