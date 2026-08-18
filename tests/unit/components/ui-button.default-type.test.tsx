// @jest-environment jsdom

import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { FormEvent } from 'react';

import UIButton from '@/components/ui-button';

function mountInsideForm(button: JSX.Element): jest.Mock {
  const onSubmit = jest.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
  render(<form onSubmit={onSubmit}>{button}</form>);
  return onSubmit;
}

describe('UIButton default type', () => {
  it('renders an explicit type="button" when no type is requested', () => {
    render(<UIButton>Plain</UIButton>);

    expect(screen.getByRole('button', { name: 'Plain' })).toHaveAttribute('type', 'button');
  });

  it('does not submit the surrounding form when no type is requested', () => {
    const onSubmit = mountInsideForm(<UIButton>Plain</UIButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Plain' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the surrounding form when type="submit" is requested', () => {
    const onSubmit = mountInsideForm(<UIButton type="submit">Send</UIButton>);

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
