import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import NavigationRowLabel from '@/components/ui-navigation-list/navigation-row-label';

describe('NavigationRowLabel', () => {
  it.each([
    ['desktop', '136px'],
    ['tablet', '131px'],
    ['drawer', '129px'],
  ] as const)('boxes a group header label to the room before the chevron on %s', (layout, room) => {
    render(<NavigationRowLabel layout={layout} variant="item" label="Settings" grouped />);

    expect(screen.getByText('Settings')).toHaveStyle({
      maxWidth: room,
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    });
  });

  it('renders an ungrouped label in a plain unstyled span the sidebar can fade', () => {
    render(<NavigationRowLabel layout="desktop" variant="item" label="Boards" />);

    const label = screen.getByText('Boards');
    expect(label.tagName).toBe('SPAN');
    expect(label).not.toHaveAttribute('class');
  });

  it('keeps a rail label as visually hidden text, even when grouped', () => {
    render(<NavigationRowLabel layout="desktop" variant="rail" label="Settings" grouped />);

    expect(screen.getByText('Settings')).toHaveStyle({ position: 'absolute', width: '1px' });
    expect(screen.getByText('Settings')).not.toHaveStyle({ maxWidth: '136px' });
  });
});
