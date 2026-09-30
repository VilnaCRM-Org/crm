import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import UITypography from '@/components/ui-typography';
import crmTheme from '@/styles/theme';
import { styleRuleFor } from '@tests/unit/utils/emotion-style-rules';

const KIT_H4 = { fontSize: '1.875rem', fontWeight: '600', color: '#484848' };

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

    expect(screen.getByRole('heading', { level: 1, name: 'Heading' })).toBeInTheDocument();
  });

  it('forwards id and role props to the rendered element', () => {
    render(
      <UITypography id="my-id" role="status">
        Status
      </UITypography>
    );

    const el = screen.getByRole('status');
    expect(el).toHaveTextContent('Status');
    expect(el).toHaveAttribute('id', 'my-id');
  });

  it('forwards sx to the rendered element', () => {
    render(<UITypography sx={{ marginTop: '3px', textAlign: 'center' }}>Styled</UITypography>);

    expect(screen.getByText('Styled')).toHaveStyle({ marginTop: '3px', textAlign: 'center' });
  });

  it('styles the variant from the ambient CRM theme rather than the kit typography', () => {
    render(
      <ThemeProvider theme={crmTheme}>
        <UITypography variant="h4" component="h2">
          Section title
        </UITypography>
      </ThemeProvider>
    );

    const heading = screen.getByRole('heading', { level: 2, name: 'Section title' });
    const rule = styleRuleFor(heading);

    expect(heading).toHaveClass('MuiTypography-h4');
    expect(crmTheme.typography.h4).toMatchObject({ fontSize: '2.125rem', fontWeight: 400 });
    expect(rule?.getPropertyValue('font-size')).toBe('2.125rem');
    expect(rule?.getPropertyValue('font-weight')).toBe('400');
    expect(rule?.getPropertyValue('line-height')).toBe('1.235');
    expect(rule?.getPropertyValue('letter-spacing')).toBe('');
    expect(rule?.getPropertyValue('color')).toBe('');
    expect(heading).not.toHaveStyle({ fontSize: KIT_H4.fontSize });
    expect(heading).not.toHaveStyle({ fontWeight: KIT_H4.fontWeight });
    expect(heading).not.toHaveStyle({ color: KIT_H4.color });
  });
});
