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

  it('renders a label element with htmlFor when component="label"', () => {
    render(
      <UiTypography component="label" htmlFor="some-id">
        Label text
      </UiTypography>
    );

    const el = screen.getByText('Label text');
    expect(el.tagName).toBe('LABEL');
    expect(el).toHaveAttribute('for', 'some-id');
  });

  it('renders an h1 element when component="h1"', () => {
    render(<UiTypography component="h1">Heading</UiTypography>);

    expect(screen.getByText('Heading').tagName).toBe('H1');
  });

  it('forwards id and role props to the rendered element', () => {
    render(
      <UiTypography id="my-id" role="status">
        Status
      </UiTypography>
    );

    const el = screen.getByText('Status');
    expect(el).toHaveAttribute('id', 'my-id');
    expect(el).toHaveAttribute('role', 'status');
  });
});
