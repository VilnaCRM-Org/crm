import { render, screen } from '@testing-library/react';

import UITypography from '@/components/ui-typography';

describe('UITypography', () => {
  it('renders a paragraph by default when no component prop is provided', () => {
    render(<UITypography>Default copy</UITypography>);

    expect(screen.getByText('Default copy').tagName).toBe('P');
  });

  it('renders the provided component prop', () => {
    render(<UITypography component="span">Inline copy</UITypography>);

    expect(screen.getByText('Inline copy').tagName).toBe('SPAN');
  });

  it('renders a label element with htmlFor when component="label"', () => {
    render(
      <UITypography component="label" htmlFor="some-id">
        Label text
      </UITypography>
    );

    const el = screen.getByText('Label text');
    expect(el.tagName).toBe('LABEL');
    expect(el).toHaveAttribute('for', 'some-id');
  });

  it('renders an h1 element when component="h1"', () => {
    render(<UITypography component="h1">Heading</UITypography>);

    expect(screen.getByText('Heading').tagName).toBe('H1');
  });

  it('forwards id and role props to the rendered element', () => {
    render(
      <UITypography id="my-id" role="status">
        Status
      </UITypography>
    );

    const el = screen.getByText('Status');
    expect(el).toHaveAttribute('id', 'my-id');
    expect(el).toHaveAttribute('role', 'status');
  });
});
