import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import UIOutlinedSmallButton from '@/components/ui-outlined-small-button';

const name: string = 'Відключити Google';
const label: string = 'Відключити';

describe('UIOutlinedSmallButton', () => {
  it('renders one outlined small button named by its aria-label, with its visible text', () => {
    render(<UIOutlinedSmallButton aria-label={name}>{label}</UIOutlinedSmallButton>);

    const button = screen.getByRole('button', { name });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveTextContent(label);
    expect(button).toHaveClass('MuiButton-outlined', 'MuiButton-sizeSmall');
    expect(button).not.toHaveAttribute('name');
  });

  it('draws the UI kit secondary pill 439:19257', () => {
    render(<UIOutlinedSmallButton aria-label={name}>{label}</UIOutlinedSmallButton>);

    const style = getComputedStyle(screen.getByRole('button', { name }));

    expect(style.color).toBe('rgb(27, 35, 39)');
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.borderRadius).toBe('3.563rem');
    expect(style.padding).toBe('0.9375rem 1.4375rem');
    expect(style.fontWeight).toBe('500');
    expect(style.fontSize).toBe('0.938rem');
    expect(style.lineHeight).toBe('1.125rem');
  });

  it('lets the caller sx win over the toolkit look', () => {
    render(
      <UIOutlinedSmallButton aria-label={name} sx={{ borderRadius: '50%', minWidth: '2.75rem' }}>
        {label}
      </UIOutlinedSmallButton>
    );

    const style = getComputedStyle(screen.getByRole('button', { name }));

    expect(style.borderRadius).toBe('50%');
    expect(style.minWidth).toBe('2.75rem');
  });

  it('hands an object ref the rendered button', () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <UIOutlinedSmallButton ref={ref} aria-label={name}>
        {label}
      </UIOutlinedSmallButton>
    );

    expect(ref.current).toBe(screen.getByRole('button', { name }));
  });

  it('runs the cleanup a callback ref returns when the button unmounts', () => {
    const cleanup = jest.fn();
    const attach = jest.fn((_button: HTMLButtonElement | null) => cleanup);

    const { unmount } = render(
      <UIOutlinedSmallButton ref={attach} aria-label={name}>
        {label}
      </UIOutlinedSmallButton>
    );

    expect(attach).toHaveBeenCalledWith(screen.getByRole('button', { name }));
    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('marks aria-disabled without the native disabled attribute, so focus stays', () => {
    render(
      <UIOutlinedSmallButton aria-label={name} aria-disabled>
        {label}
      </UIOutlinedSmallButton>
    );

    const button = screen.getByRole('button', { name });
    act(() => button.focus());

    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeEnabled();
    expect(button).toHaveFocus();
  });

  it('reports aria-disabled false when the caller is idle', () => {
    render(
      <UIOutlinedSmallButton aria-label={name} aria-disabled={false}>
        {label}
      </UIOutlinedSmallButton>
    );

    expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'false');
  });

  it('reports every click through onClick, leaving the busy guard to the caller', () => {
    const onClick = jest.fn();
    render(
      <UIOutlinedSmallButton aria-label={name} aria-disabled onClick={onClick}>
        {label}
      </UIOutlinedSmallButton>
    );

    fireEvent.click(screen.getByRole('button', { name }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
