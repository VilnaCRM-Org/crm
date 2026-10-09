import { fireEvent, render, screen } from '@testing-library/react';

import UICheckbox from '@/components/ui-checkbox';

const label: string = 'Remember me';

describe('UICheckbox', () => {
  it('renders a checkbox named by its label', () => {
    render(<UICheckbox label={label} checked={false} onChange={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
  });

  it('reflects the checked prop', () => {
    render(<UICheckbox label={label} checked onChange={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
  });

  it('reports a click through onChange', () => {
    const onChange = jest.fn();
    render(<UICheckbox label={label} checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: label }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
