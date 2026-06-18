import { render, screen } from '@testing-library/react';

import SubmitSpinner from '@/components/ui-form/submit-spinner';
import { paletteColors } from '@/styles/colors';

describe('SubmitSpinner', () => {
  it('renders exactly one spinner that is hidden from the accessibility tree', () => {
    render(<SubmitSpinner />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getAllByRole('progressbar', { hidden: true })).toHaveLength(1);
    expect(screen.getByRole('progressbar', { hidden: true })).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('uses a white stroke to match the grey disabled loading button', () => {
    render(<SubmitSpinner />);

    const spinner = screen.getByRole('progressbar', { hidden: true });
    expect(paletteColors.background.default).toBe('#FFFFFF');
    expect(spinner).toHaveStyle({ color: paletteColors.background.default });
  });

  it('renders at size 28 with thickness 4.5', () => {
    render(<SubmitSpinner />);

    const spinner = screen.getByRole('progressbar', { hidden: true });
    expect(spinner).toHaveStyle({ width: '28px', height: '28px' });
    expect(spinner.innerHTML).toContain('stroke-width="4.5"');
  });
});
