import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { createRef, type JSX, type RefObject } from 'react';

import useDrawerFocus from '@/components/ui-app-header/use-drawer-focus';

interface HarnessProps {
  readonly open: boolean;
  readonly restore: boolean;
  readonly burger: RefObject<HTMLButtonElement | null>;
}

function Harness({ open, restore, burger }: HarnessProps): JSX.Element {
  useDrawerFocus({ open, restore, burger });

  return (
    <button type="button" ref={burger}>
      burger
    </button>
  );
}

function Page({
  mounted,
  open,
  restore,
  burger,
}: HarnessProps & { mounted: boolean }): JSX.Element {
  return (
    <>
      {mounted && <Harness open={open} restore={restore} burger={burger} />}
      <main tabIndex={-1}>main</main>
    </>
  );
}

describe('useDrawerFocus', () => {
  it('leaves focus alone while no restore is requested', () => {
    render(<Harness open={false} restore={false} burger={createRef<HTMLButtonElement>()} />);

    expect(screen.getByRole('button', { name: 'burger' })).not.toHaveFocus();
  });

  it('returns focus to the burger once a dismissed drawer has closed', () => {
    render(<Harness open={false} restore burger={createRef<HTMLButtonElement>()} />);

    expect(screen.getByRole('button', { name: 'burger' })).toHaveFocus();
  });

  it('does not return focus while the drawer is still open', () => {
    render(<Harness open restore burger={createRef<HTMLButtonElement>()} />);

    expect(screen.getByRole('button', { name: 'burger' })).not.toHaveFocus();
  });

  it('moves focus to main when it unmounts while the drawer is open', () => {
    const burger = createRef<HTMLButtonElement>();
    const view = render(<Page mounted open restore={false} burger={burger} />);

    view.rerender(<Page mounted={false} open restore={false} burger={burger} />);

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('does not move focus when it unmounts while the drawer is closed', () => {
    const burger = createRef<HTMLButtonElement>();
    const view = render(<Page mounted open={false} restore={false} burger={burger} />);

    view.rerender(<Page mounted={false} open={false} restore={false} burger={burger} />);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });
});
