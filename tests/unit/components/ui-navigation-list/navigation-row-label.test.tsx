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

  it('renders the bare text of an ungrouped row, with no box of its own', () => {
    render(
      <main>
        <NavigationRowLabel layout="desktop" variant="item" label="Boards" />
      </main>
    );

    expect(screen.getByText('Boards')).toBe(screen.getByRole('main'));
  });

  it('keeps a rail label as visually hidden text, even when grouped', () => {
    render(<NavigationRowLabel layout="desktop" variant="rail" label="Settings" grouped />);

    expect(screen.getByText('Settings')).toHaveStyle({ position: 'absolute', width: '1px' });
    expect(screen.getByText('Settings')).not.toHaveStyle({ maxWidth: '136px' });
  });
});
