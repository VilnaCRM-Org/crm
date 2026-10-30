import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';

import useDrawerFocus from '@/components/ui-app-header/use-drawer-focus';

interface HarnessProps {
  readonly open: boolean;
  readonly restore: boolean;
}

function Harness({ open, restore }: HarnessProps): JSX.Element {
  const attachBurger = useDrawerFocus({ open, restore });

  return (
    <button type="button" ref={attachBurger}>
      burger
    </button>
  );
}

function Page({ mounted, open, restore }: HarnessProps & { mounted: boolean }): JSX.Element {
  return (
    <>
      {mounted && <Harness open={open} restore={restore} />}
      <main tabIndex={-1}>main</main>
    </>
  );
}

describe('useDrawerFocus', () => {
  it('leaves focus alone while no restore is requested', () => {
    render(<Harness open={false} restore={false} />);

    expect(screen.getByRole('button', { name: 'burger' })).not.toHaveFocus();
  });

  it('returns focus to the burger once a dismissed drawer has closed', () => {
    render(<Harness open={false} restore />);

    expect(screen.getByRole('button', { name: 'burger' })).toHaveFocus();
  });

  it('does not return focus while the drawer is still open', () => {
    render(<Harness open restore />);

    expect(screen.getByRole('button', { name: 'burger' })).not.toHaveFocus();
  });

  it('moves focus to main when it unmounts while the drawer is open', () => {
    const view = render(<Page mounted open restore={false} />);

    view.rerender(<Page mounted={false} open restore={false} />);

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('moves focus to main once a drawer left for a navigation has closed', () => {
    const view = render(<Page mounted open restore={false} />);
    expect(screen.getByRole('main')).not.toHaveFocus();

    view.rerender(<Page mounted open={false} restore={false} />);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'burger' })).not.toHaveFocus();
  });

  it('does not move focus to main for a drawer that was never open', () => {
    const view = render(<Page mounted open={false} restore />);
    screen.getByRole('button', { name: 'burger' }).blur();

    view.rerender(<Page mounted open={false} restore={false} />);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('does not move focus when it unmounts while the drawer is closed', () => {
    const view = render(<Page mounted open={false} restore={false} />);

    view.rerender(<Page mounted={false} open={false} restore={false} />);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });
});
