import { render, screen } from '@testing-library/react';

import SubmitSpinner from '@/components/ui-form/submit-spinner';
import { paletteColors } from '@/styles/colors';

function mockViewport(matches: boolean): void {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('SubmitSpinner', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
  });

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

  it('renders at size 28 with thickness 4.5 below 768px', () => {
    mockViewport(false);
    render(<SubmitSpinner />);

    const spinner = screen.getByRole('progressbar', { hidden: true });
    expect(spinner).toHaveStyle({ width: '28px', height: '28px' });
    expect(spinner.innerHTML).toContain('stroke-width="4.5"');
  });

  it('renders at size 40 at or above 768px', () => {
    mockViewport(true);
    render(<SubmitSpinner />);

    const spinner = screen.getByRole('progressbar', { hidden: true });
    expect(spinner).toHaveStyle({ width: '40px', height: '40px' });
  });
});
