import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import HeaderBadge from '@/components/ui-app-header/header-badge';

describe('HeaderBadge', () => {
  it.each([1, 2, 5, 8, 21])(
    'renders the digits of %i hidden from assistive technology',
    (count) => {
      render(<HeaderBadge count={count} />);

      const badge = screen.getByText(String(count));

      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(badge).toHaveStyle({ width: '18px', height: '18px', backgroundColor: '#D0D4D8' });
    }
  );

  it.each([0, -1, 0.5, 1.5, Number.NaN, Number.POSITIVE_INFINITY, null, undefined])(
    'renders no badge and no digit for %s',
    (count) => {
      const { container } = render(<HeaderBadge count={count} />);

      expect(container).toBeEmptyDOMElement();
    }
  );

  it('renders no badge when the count prop is absent', () => {
    const { container } = render(<HeaderBadge />);

    expect(container).toBeEmptyDOMElement();
  });
});
