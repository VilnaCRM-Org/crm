import '@testing-library/jest-dom';
import { act, isInaccessible, render, screen } from '@testing-library/react';

import NavigationRailTooltip from '@/components/ui-navigation-list/navigation-rail-tooltip';

const anchorAt = (left: number, top: number): HTMLElement => {
  const anchor = document.createElement('div');
  anchor.getBoundingClientRect = (): DOMRect => new DOMRect(left, top, 72, 54);

  return anchor;
};

const tooltipOf = (): HTMLElement =>
  screen.getAllByRole('generic', { hidden: true })[1] as HTMLElement;

describe('NavigationRailTooltip', () => {
  it('shows the label inside a body that is hidden from assistive technology', () => {
    render(<NavigationRailTooltip label="Integrations" shape="desktop" anchor={anchorAt(0, 0)} />);

    const body = screen.getByText('Integrations');

    expect(body).toBeInTheDocument();
    expect(isInaccessible(body)).toBe(true);
    expect(tooltipOf()).toHaveAttribute('aria-hidden', 'true');
    expect(tooltipOf()).toContainElement(body);
    expect(screen.queryAllByRole('generic')).toHaveLength(1);
    expect(screen.getAllByRole('generic', { hidden: true })).toHaveLength(4);
    expect(body).toHaveStyle({ color: '#191B1E', fontSize: '16px', lineHeight: '18px' });
  });

  it.each([
    ['desktop', '73px', '104px'],
    ['tablet', '77px', '108px'],
    ['tabletProducts', '77px', '109px'],
    ['tabletCompact', '77px', '110px'],
    ['action', '77px', '104px'],
  ] as const)('fixes the %s tooltip at %s, %s, its offset from the row', (shape, left, top) => {
    render(<NavigationRailTooltip label="Row" shape={shape} anchor={anchorAt(12, 100)} />);

    expect(tooltipOf()).toHaveStyle({ left, top, position: 'fixed' });
  });

  it('follows its row when the rail list scrolls and when the window resizes', () => {
    let top = 100;
    const anchor = document.createElement('div');
    anchor.getBoundingClientRect = (): DOMRect => new DOMRect(12, top, 72, 54);
    const list = document.createElement('ol');
    document.body.append(list);
    render(<NavigationRailTooltip label="Row" shape="desktop" anchor={anchor} />);

    top = 40;
    act(() => {
      list.dispatchEvent(new Event('scroll'));
    });
    expect(tooltipOf()).toHaveStyle({ left: '73px', top: '44px' });

    top = 10;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(tooltipOf()).toHaveStyle({ top: '14px' });
    list.remove();
  });

  it('stops following its row once it unmounts', () => {
    const anchor = anchorAt(12, 100);
    const measure = jest.spyOn(anchor, 'getBoundingClientRect');
    const view = render(<NavigationRailTooltip label="Row" shape="desktop" anchor={anchor} />);
    const calls = measure.mock.calls.length;

    view.unmount();
    document.body.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));

    expect(measure).toHaveBeenCalledTimes(calls);
  });
});
