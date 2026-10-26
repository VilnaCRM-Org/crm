import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import DrawerHeaderCopies from '@/components/ui-navigation-drawer/drawer-header-copies';

const avatarCopy = (): HTMLElement =>
  screen.getAllByRole('generic', { hidden: true }).at(-1) as HTMLElement;

describe('DrawerHeaderCopies', () => {
  it('renders the bell, the list and the avatar as aria-hidden, non-interactive copies', () => {
    const { container } = render(<DrawerHeaderCopies />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('generic')).toHaveLength(1);
    expect(container).toContainHTML('aria-hidden="true"');
  });

  it('paints the avatar copy as the drawn 40 px #E1E7EA circle', () => {
    render(<DrawerHeaderCopies />);

    expect(avatarCopy()).toHaveAttribute('aria-hidden', 'true');
    expect(avatarCopy()).toHaveStyle({
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: 'rgb(225, 231, 234)',
      color: 'rgb(26, 28, 30)',
    });
  });

  it('draws the no-data person glyph inside the avatar copy, as the header avatar does', () => {
    render(<DrawerHeaderCopies />);

    expect(avatarCopy()).toContainHTML('data-testid="PersonOutlinedIcon"');
    expect(avatarCopy()).toContainHTML('aria-hidden="true"');
    expect(screen.queryByText(/\S/u)).not.toBeInTheDocument();
  });

  it('keeps the avatar copy out of the tab order', () => {
    render(<DrawerHeaderCopies />);

    expect(avatarCopy()).not.toHaveAttribute('tabindex');
    expect(avatarCopy()).not.toContainHTML('tabindex');
  });
});
