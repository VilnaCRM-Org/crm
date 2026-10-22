import { render, screen } from '@testing-library/react';

import UILiveStatus from '@/components/ui-live-status';

describe('UILiveStatus', () => {
  it('renders one polite status region carrying the message', () => {
    render(<UILiveStatus message="Submitting…" />);

    const regions = screen.getAllByRole('status');
    expect(regions).toHaveLength(1);
    expect(regions[0]).toHaveAttribute('aria-atomic', 'true');
    expect(regions[0]).toHaveTextContent('Submitting…');
  });

  it('keeps the default markup when politeness is polite', () => {
    const { container: implicit } = render(<UILiveStatus message="Submitting…" />);
    const { container: explicit } = render(
      <UILiveStatus message="Submitting…" politeness="polite" />
    );

    expect(explicit.innerHTML).toBe(implicit.innerHTML);
    expect(implicit.innerHTML).toMatch(/^<span role="status" aria-atomic="true" class="[^"]+">/);
  });

  it('renders one atomic alert region and no status region when assertive', () => {
    render(<UILiveStatus message="Не вдалося" politeness="assertive" />);

    const alerts = screen.getAllByRole('alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveAttribute('aria-atomic', 'true');
    expect(alerts[0]).toHaveTextContent('Не вдалося');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the region present but empty for an empty message', () => {
    render(<UILiveStatus message="" />);

    const region = screen.getByRole('status');
    expect(region).toBeInTheDocument();
    expect(region).toBeEmptyDOMElement();
  });

  it('is visually hidden so it occupies no layout box', () => {
    render(<UILiveStatus message="Submitting…" />);

    const region = screen.getByRole('status');
    expect(region).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    });
  });
});
