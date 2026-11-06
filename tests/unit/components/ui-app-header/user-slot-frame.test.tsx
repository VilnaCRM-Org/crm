import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { type ComponentType, type JSX, lazy } from 'react';

import UserSlotFrame from '@/components/ui-app-header/user-slot-frame';

const NeverResolves = lazy(() => new Promise<never>(() => undefined));

function Chip(): JSX.Element {
  return <button type="button">Chip</button>;
}

const boxes = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

describe('UserSlotFrame', () => {
  it.each([
    ['desktop', '225px', '48px'],
    ['tablet', '253px', '52px'],
  ] as const)(
    'reserves the %s chip box at %s wide at least and sizes to a wider chip',
    (layout, minWidth, height) => {
      render(<UserSlotFrame layout={layout} />);

      expect(boxes()[1]).toHaveStyle({ width: 'max-content', minWidth, height });
    }
  );

  it('reserves the 40 px mobile avatar box', () => {
    render(<UserSlotFrame layout="mobile" />);

    expect(boxes()[1]).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('holds an aria-hidden placeholder filling the box while no slot is given', () => {
    render(<UserSlotFrame layout="desktop" />);

    const [, , placeholder] = boxes();

    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder).toHaveStyle({ width: '100%', height: '100%' });
    expect(placeholder).toBeEmptyDOMElement();
  });

  it('keeps the same placeholder while the slot has not resolved', () => {
    render(
      <UserSlotFrame layout="tablet">
        <NeverResolves />
      </UserSlotFrame>
    );

    const [, , placeholder] = boxes();

    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(placeholder).toBeEmptyDOMElement();
  });

  it('swaps the placeholder for the slot when its chunk arrives', async () => {
    let arrive: (module: { default: ComponentType }) => void = () => undefined;
    const Slot = lazy(
      () =>
        new Promise<{ default: ComponentType }>((resolve) => {
          arrive = resolve;
        })
    );
    render(
      <UserSlotFrame layout="desktop">
        <Slot />
      </UserSlotFrame>
    );
    const [, , placeholder] = boxes();

    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('button', { name: 'Chip' })).not.toBeInTheDocument();

    await act(async () => arrive({ default: Chip }));

    expect(await screen.findByRole('button', { name: 'Chip' })).toBeInTheDocument();
    expect(placeholder).not.toBeInTheDocument();
    expect(boxes()).toHaveLength(2);
  });

  it('renders the slot in place of the placeholder once it has arrived', () => {
    render(
      <UserSlotFrame layout="desktop">
        <button type="button">Chip</button>
      </UserSlotFrame>
    );

    expect(screen.getByRole('button', { name: 'Chip' })).toBeInTheDocument();
    expect(boxes()).toHaveLength(2);
  });
});
