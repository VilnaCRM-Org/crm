import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import DrawerScrim from '@/components/ui-navigation-drawer/drawer-scrim';

const scrim = (): HTMLElement =>
  screen.getAllByRole('generic', { hidden: true }).at(-1) as HTMLElement;

describe('DrawerScrim', () => {
  const original = window.innerHeight;

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.replaceChildren();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: original });
  });

  it('paints the 5 % tint as an aria-hidden layer that takes no pointer events', () => {
    render(<DrawerScrim duration={0} />);

    expect(scrim()).toHaveAttribute('aria-hidden', 'true');
    expect(scrim()).toHaveStyle({
      position: 'absolute',
      top: '0px',
      left: '0px',
      right: '0px',
      bottom: '0px',
      pointerEvents: 'none',
      backgroundColor: 'rgba(54, 79, 93, 0.05)',
    });
  });

  it('ends at the top of the page footer in view', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 718 });
    const footer = document.body.appendChild(document.createElement('footer'));
    footer.getBoundingClientRect = (): DOMRect => ({ top: 678 }) as DOMRect;

    render(<DrawerScrim duration={0} />);

    expect(scrim()).toHaveStyle({ bottom: '40px' });
  });

  it('subscribes to resizes once while it re-renders and unsubscribes when it unmounts', () => {
    const add = jest.spyOn(window, 'addEventListener');
    const remove = jest.spyOn(window, 'removeEventListener');
    const { rerender, unmount } = render(<DrawerScrim duration={0} />);

    rerender(<DrawerScrim duration={200} />);
    rerender(<DrawerScrim duration={0} />);
    const added = add.mock.calls.filter(([type]) => type === 'resize');
    const removedWhileOpen = remove.mock.calls.filter(([type]) => type === 'resize').length;
    unmount();

    expect(added).toHaveLength(1);
    expect(removedWhileOpen).toBe(0);
    expect(remove).toHaveBeenCalledWith('resize', added[0]?.[1]);
  });

  it('fades in over the given duration', () => {
    render(<DrawerScrim duration={200} />);

    expect(scrim().style.transition).toContain('200ms');
  });
});
