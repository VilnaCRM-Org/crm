import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import HeaderBadge from '@/components/ui-app-header/header-badge';

describe('HeaderBadge', () => {
  it.each([1, 2, 5, 8, 21, 99])(
    'renders the digits of %i hidden from assistive technology',
    (count) => {
      render(<HeaderBadge count={count} />);

      const badge = screen.getByText(String(count));

      expect(badge).toHaveAttribute('aria-hidden', 'true');
      expect(badge).toHaveStyle({ minWidth: '18px', height: '18px', backgroundColor: '#D0D4D8' });
    }
  );

  it.each([100, 150, 1000])('renders the digits of the count %i, with no cap', (count) => {
    render(<HeaderBadge count={count} />);

    expect(screen.getByText(String(count))).toHaveAttribute('aria-hidden', 'true');
  });

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

  it('keeps the muted #D0D4D8 fill by default and for the muted tone', () => {
    render(<HeaderBadge count={3} tone="muted" />);

    expect(screen.getByText('3')).toHaveStyle({ backgroundColor: '#D0D4D8' });
  });

  it('paints the alert tone #D63333 with white digits, still aria-hidden', () => {
    render(<HeaderBadge count={3} tone="alert" />);

    expect(screen.getByText('3')).toHaveStyle({ backgroundColor: '#D63333', color: '#FFFFFF' });
    expect(screen.getByText('3')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders nothing for the alert tone without a count', () => {
    const { container } = render(<HeaderBadge count={0} tone="alert" />);

    expect(container).toBeEmptyDOMElement();
  });
});
