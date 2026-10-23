import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import NavigationRailTooltip from '@/components/ui-navigation-list/navigation-rail-tooltip';

describe('NavigationRailTooltip', () => {
  it('shows the label inside a body that is hidden from assistive technology', () => {
    render(<NavigationRailTooltip label="Integrations" shape="desktop" />);

    const body = screen.getByText('Integrations');

    expect(body).toBeInTheDocument();
    expect(screen.queryAllByRole('generic')).toHaveLength(1);
    expect(screen.getAllByRole('generic', { hidden: true })).toHaveLength(4);
    expect(body).toHaveStyle({ color: '#191B1E', fontSize: '16px', lineHeight: '18px' });
  });

  it.each([
    ['desktop', '61px', '4px'],
    ['tablet', '65px', '8px'],
    ['tabletProducts', '65px', '9px'],
    ['tabletCompact', '65px', '10px'],
    ['action', '65px', '4px'],
  ] as const)('places the %s tooltip at %s, %s from its row', (shape, left, top) => {
    render(<NavigationRailTooltip label="Row" shape={shape} />);

    expect(screen.getAllByRole('generic', { hidden: true })[1]).toHaveStyle({
      left,
      top,
      position: 'absolute',
    });
  });
});
