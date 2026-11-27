import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import useTileFocus from '@/modules/user/features/settings/hooks/use-tile-focus';

function Probe({ linked }: { linked: boolean }): JSX.Element {
  const { controlRef, attach } = useTileFocus(linked);
  const name = linked ? 'unlink' : 'link';

  return (
    <>
      <button key={name} type="button" ref={attach}>
        {name}
      </button>
      <button type="button">elsewhere</button>
      <output>{controlRef.current?.textContent}</output>
    </>
  );
}

describe('useTileFocus', () => {
  it('leaves the focus alone on mount', () => {
    render(<Probe linked={false} />);

    expect(document.body).toHaveFocus();
  });

  it.each([
    ['linked', false, 'unlink'],
    ['unlinked', true, 'link'],
  ])('moves the focus to the new control once the tile is %s', (_name, linked, next) => {
    const { rerender } = render(<Probe linked={linked} />);
    screen.getByRole('button', { name: linked ? 'unlink' : 'link' }).focus();

    rerender(<Probe linked={!linked} />);

    expect(screen.getByRole('button', { name: next })).toHaveFocus();
  });

  it('never takes the focus from another element, nor later', () => {
    const { rerender } = render(<Probe linked={false} />);
    screen.getByRole('button', { name: 'link' }).focus();
    rerender(<Probe linked />);
    screen.getByRole('button', { name: 'elsewhere' }).focus();

    rerender(<Probe linked={false} />);

    expect(screen.getByRole('button', { name: 'elsewhere' })).toHaveFocus();
  });

  it('exposes the live control', () => {
    const { rerender } = render(<Probe linked={false} />);
    rerender(<Probe linked />);
    rerender(<Probe linked />);

    expect(screen.getByRole('status')).toHaveTextContent('unlink');
  });
});
