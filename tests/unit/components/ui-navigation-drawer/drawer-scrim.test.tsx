import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import DrawerScrim from '@/components/ui-navigation-drawer/drawer-scrim';

const scrim = (): HTMLElement =>
  screen.getAllByRole('generic', { hidden: true }).at(-1) as HTMLElement;

describe('DrawerScrim', () => {
  const original = window.innerHeight;

  afterEach(() => {
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

  it('fades in over the given duration', () => {
    render(<DrawerScrim duration={200} />);

    expect(scrim().style.transition).toContain('200ms');
  });
});
