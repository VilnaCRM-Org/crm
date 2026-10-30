import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UserChipBody from '@/modules/user/features/settings/components/user-menu/user-chip-body';

const identity = { displayName: 'Anna Koval', monogram: 'AK' };

describe('UserChipBody', () => {
  it('draws the monogram, the name and a decorative caret', () => {
    const { container } = render(<UserChipBody layout="desktop" identity={identity} />);

    expect(screen.getByText('AK')).toHaveStyle({ width: '32px', height: '32px' });
    expect(screen.getByText('Anna Koval')).toHaveStyle({ left: '49px', top: '13px' });
    expect(container).toContainHTML('aria-hidden="true" focusable="false"');
  });

  it.each([
    ['desktop', '7px', '6px'],
    ['tablet', '15px', '9px'],
  ] as const)('pins the %s avatar box absolutely at %s,%s', (layout, left, top) => {
    render(<UserChipBody layout={layout} identity={identity} />);

    const avatar = screen.getByText('AK');
    const frame = screen
      .getAllByRole('generic')
      .filter((box) => box !== avatar && box.contains(avatar))
      .at(-1);

    expect(frame).toHaveStyle({ position: 'absolute', left, top });
  });

  it('places the tablet name at 57,16 in 16 px', () => {
    render(<UserChipBody layout="tablet" identity={identity} />);

    expect(screen.getByText('Anna Koval')).toHaveStyle({
      left: '57px',
      top: '16px',
      fontSize: '16px',
    });
  });

  it('draws no name and the person glyph for an unknown identity', () => {
    const { container } = render(<UserChipBody layout="desktop" identity={null} />);

    expect(container).toContainHTML('data-testid="PersonOutlinedIcon"');
    expect(screen.queryByText(/\S/u)).not.toBeInTheDocument();
  });
});
