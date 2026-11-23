import { screen } from '@testing-library/react';

export default function findBellWrapper(bell: HTMLElement): HTMLElement {
  const wrapper = screen
    .getAllByRole('generic', { hidden: true })
    .filter((node) => node !== bell && node.contains(bell))
    .at(-1);
  if (wrapper === undefined) throw new Error('the bell has no wrapper');

  return wrapper;
}
