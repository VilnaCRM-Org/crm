import { screen, within } from '@testing-library/react';

const fieldGrid = (field: HTMLElement, label: string): HTMLElement => {
  const grid = screen
    .getAllByRole('generic')
    .filter((element) => element.contains(field) && within(element).queryByText(label) !== null)
    .at(-1);
  if (grid === undefined) throw new Error(`field grid for "${label}" not found`);

  return grid;
};

export default fieldGrid;
