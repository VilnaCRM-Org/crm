import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { lazy } from 'react';

import UserSlotFrame from '@/components/ui-app-header/user-slot-frame';

const NeverResolves = lazy(() => new Promise<never>(() => undefined));

const boxes = (): HTMLElement[] => screen.getAllByRole('generic', { hidden: true });

describe('UserSlotFrame', () => {
  it.each([
    ['desktop', '225px', '48px'],
    ['tablet', '253px', '52px'],
    ['mobile', '40px', '40px'],
  ] as const)('reserves the %s chip box', (layout, width, height) => {
    render(<UserSlotFrame layout={layout} />);

    expect(boxes()[1]).toHaveStyle({ width, height });
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
