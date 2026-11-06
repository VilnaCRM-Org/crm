import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UserAvatar from '@/modules/user/features/settings/components/user-menu/user-avatar';

describe('UserAvatar', () => {
  it.each([
    ['chip', '32px', '12px'],
    ['avatar', '40px', '15px'],
  ] as const)('draws the %s monogram in a %s disc at %s', (size, box, fontSize) => {
    render(<UserAvatar monogram="ЄМ" size={size} />);

    expect(screen.getByText('ЄМ')).toHaveStyle({
      width: box,
      height: box,
      fontSize,
      borderRadius: '50%',
      backgroundColor: '#E1E7EA',
      color: '#1A1C1E',
    });
  });

  it('hides the monogram from assistive technology', () => {
    render(<UserAvatar monogram="ЄМ" size="chip" />);

    expect(screen.getByText('ЄМ')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each(['chip', 'avatar'] as const)(
    'shows the person glyph for an empty %s monogram',
    (size) => {
      const { container } = render(<UserAvatar monogram="" size={size} />);

      expect(container).toContainHTML('data-testid="PersonOutlinedIcon"');
      expect(screen.queryByText(/\S/u)).not.toBeInTheDocument();
    }
  );
});
