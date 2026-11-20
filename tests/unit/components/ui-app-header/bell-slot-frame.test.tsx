import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { type ComponentType, type JSX, lazy } from 'react';

import BellSlotFrame from '@/components/ui-app-header/bell-slot-frame';

const NeverResolves = lazy(() => new Promise<never>(() => undefined));

function Bell(): JSX.Element {
  return <button type="button">Bell</button>;
}

const boxes = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

describe('BellSlotFrame', () => {
  it.each([
    ['desktop', '48px'],
    ['tablet', '52px'],
    ['mobile', '24px'],
  ] as const)('reserves the %s bell box at %s square', (layout, size) => {
    render(<BellSlotFrame layout={layout} />);

    expect(boxes()[1]).toHaveStyle({ width: size, height: size });
  });

  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'lets the %s bell overflow its frame and anchors the merged notice',
    (layout) => {
      render(<BellSlotFrame layout={layout} />);

      expect(boxes()[1]).toHaveStyle({ overflow: 'visible', position: 'relative' });
    }
  );

  it('holds an aria-hidden placeholder filling the box while no slot is given', () => {
    render(<BellSlotFrame layout="desktop" />);

    const [, , placeholder] = boxes();

    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder).toHaveStyle({ width: '100%', height: '100%' });
    expect(placeholder).toBeEmptyDOMElement();
    expect(boxes()).toHaveLength(3);
  });

  it.each(['desktop', 'tablet', 'mobile'] as const)(
    'keeps the same placeholder at %s while the child suspends',
    (layout) => {
      render(
        <BellSlotFrame layout={layout}>
          <NeverResolves />
        </BellSlotFrame>
      );

      const [, , placeholder] = boxes();

      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
      expect(placeholder).toBeEmptyDOMElement();
      expect(boxes()).toHaveLength(3);
    }
  );

  it('swaps the placeholder for the child when its chunk arrives', async () => {
    let arrive: (module: { default: ComponentType }) => void = () => undefined;
    const Slot = lazy(
      () =>
        new Promise<{ default: ComponentType }>((resolve) => {
          arrive = resolve;
        })
    );
    render(
      <BellSlotFrame layout="desktop">
        <Slot />
      </BellSlotFrame>
    );
    const [, , placeholder] = boxes();

    await act(async () => arrive({ default: Bell }));

    expect(await screen.findByRole('button', { name: 'Bell' })).toBeInTheDocument();
    expect(placeholder).not.toBeInTheDocument();
    expect(boxes()).toHaveLength(2);
  });

  it('shows a ready child in the same box, with no placeholder', () => {
    render(
      <BellSlotFrame layout="tablet">
        <Bell />
      </BellSlotFrame>
    );

    expect(screen.getByRole('button', { name: 'Bell' })).toBeInTheDocument();
    expect(boxes()).toHaveLength(2);
    expect(boxes()[1]).toHaveStyle({ width: '52px', height: '52px' });
  });

  it('adds no focusable element, role or accessible name of its own', () => {
    const { container } = render(<BellSlotFrame layout="desktop" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(container).not.toContainHTML('role=');
    expect(container).not.toContainHTML('aria-label');
    expect(container).not.toContainHTML('tabindex');
  });
});
