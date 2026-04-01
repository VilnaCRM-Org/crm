import { render, screen } from '@testing-library/react';

import UiTypography from '@/components/UITypography';

describe('UiTypography', () => {
  it('renders a paragraph by default when no component prop is provided', () => {
    render(<UiTypography>Default copy</UiTypography>);

    expect(screen.getByText('Default copy').tagName).toBe('P');
  });

  it('renders the provided component prop', () => {
    render(<UiTypography component="span">Inline copy</UiTypography>);

    expect(screen.getByText('Inline copy').tagName).toBe('SPAN');
  });
});
