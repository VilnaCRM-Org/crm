import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import DrawerHeaderCopies from '@/components/ui-navigation-drawer/drawer-header-copies';
import { customColors } from '@/styles/colors';

jest.mock('@/assets/icons/shell/bell-01.svg', () => ({
  ReactComponent: ({
    className,
    'aria-hidden': hidden,
    focusable,
  }: {
    className?: string;
    'aria-hidden'?: 'true';
    focusable?: 'false';
  }): ReactElement => (
    <svg role="img" aria-hidden={hidden} focusable={focusable} className={className} />
  ),
}));

const glyphCopies = (): HTMLElement[] => screen.getAllByRole('img', { hidden: true });

const bellCopy = (): HTMLElement => {
  const [bell] = glyphCopies();
  if (bell === undefined) throw new Error('expected the drawn bell copy');

  return bell;
};

const avatarCopy = (): HTMLElement =>
  screen.getAllByRole('generic', { hidden: true }).at(-1) as HTMLElement;

describe('DrawerHeaderCopies', () => {
  it('renders the bell, the list and the avatar as aria-hidden, non-interactive copies', () => {
    const { container } = render(<DrawerHeaderCopies />);

    expect(screen.queryByRole('button', { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { hidden: true })).not.toBeInTheDocument();
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

  it('paints a supplied avatar inside the circle in place of the no-data glyph', () => {
    render(<DrawerHeaderCopies avatar="ОП" />);
    const circle = avatarCopy();

    expect(circle).toHaveAttribute('aria-hidden', 'true');
    expect(circle).toHaveTextContent(/^ОП$/u);
    expect(circle).not.toContainHTML('PersonOutlinedIcon');
    expect(circle).toHaveStyle({ width: '40px', height: '40px', borderRadius: '50%' });
  });

  it('keeps the no-data glyph while the supplied avatar is null', () => {
    render(<DrawerHeaderCopies avatar={null} />);

    expect(avatarCopy()).toContainHTML('data-testid="PersonOutlinedIcon"');
  });

  it('draws the bell copy in the disabled #D0D4D8 glyph colour without a live bell', () => {
    render(<DrawerHeaderCopies />);

    expect(bellCopy()).toHaveStyle({ color: customColors.checkbox.main });
  });

  it('draws the bell copy in the enabled #1A1C1E glyph colour with a live bell', () => {
    render(<DrawerHeaderCopies liveBell />);

    expect(bellCopy()).toHaveStyle({ color: '#1A1C1E' });
    expect(bellCopy()).toHaveStyle({ color: customColors.text.dark });
    expect(bellCopy()).toHaveAttribute('aria-hidden', 'true');
    expect(bellCopy()).toHaveAttribute('focusable', 'false');
    expect(bellCopy()).not.toHaveAttribute('tabindex');
    expect(glyphCopies()[1]).toHaveStyle({ color: customColors.checkbox.main });
  });

  it('holds no focusable element with a live bell', () => {
    render(<DrawerHeaderCopies liveBell />);

    expect(screen.queryByRole('button', { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('generic')).toHaveLength(1);
  });

  it('renders the same markup with liveBell false as without it', () => {
    const { container: absent } = render(<DrawerHeaderCopies />);
    const { container: off } = render(<DrawerHeaderCopies liveBell={false} />);

    expect(off).toContainHTML(absent.innerHTML);
    expect(absent).toContainHTML(off.innerHTML);
  });
});
