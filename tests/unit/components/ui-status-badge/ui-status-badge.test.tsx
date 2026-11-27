import { render, screen } from '@testing-library/react';

import UIStatusBadge from '@/components/ui-status-badge';

const linked: string = 'Підключено';
const notLinked: string = 'Не підключено';

describe('UIStatusBadge', () => {
  it('renders a static image named by its label, with no control and no tab stop', () => {
    render(<UIStatusBadge label={linked} active />);

    const badge = screen.getByRole('img', { name: linked });

    expect(badge).not.toHaveAttribute('tabindex');
    expect(badge).not.toHaveAttribute('aria-pressed');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('paints the active state as the UI kit success disc with a white check', () => {
    render(<UIStatusBadge label={linked} active />);

    const style = getComputedStyle(screen.getByRole('img', { name: linked }));

    expect(style.backgroundColor).toBe('rgb(56, 179, 134)');
    expect(style.color).toBe('rgb(255, 255, 255)');
  });

  it('paints the rest state as a white disc with a pale check', () => {
    render(<UIStatusBadge label={notLinked} active={false} />);

    const style = getComputedStyle(screen.getByRole('img', { name: notLinked }));

    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.color).toBe('rgb(225, 231, 234)');
  });

  it('applies the caller sx to the badge root', () => {
    render(<UIStatusBadge label={linked} active sx={{ marginLeft: '7px' }} />);

    expect(getComputedStyle(screen.getByRole('img', { name: linked })).marginLeft).toBe('7px');
  });
});
