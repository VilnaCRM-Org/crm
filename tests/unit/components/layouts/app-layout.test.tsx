import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import AppLayout from '@/components/layouts/app-layout';
import ROUTER_FUTURE_FLAGS from '@tests/unit/utils/router-future-flags';

type Entry = Parameters<typeof MemoryRouter>[0]['initialEntries'];

let navigate: ReturnType<typeof useNavigate> | undefined;

function NavigationProbe(): JSX.Element {
  navigate = useNavigate();

  return <span>probe</span>;
}

function renderLayout(entries: Entry): void {
  render(
    <MemoryRouter initialEntries={entries} future={ROUTER_FUTURE_FLAGS}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>home page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  it('renders the routed content inside a main landmark', () => {
    renderLayout(['/']);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it('moves focus to the main landmark after a post-login redirect', () => {
    renderLayout([{ pathname: '/', state: { focusMain: true } }] as Entry);

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('does not steal focus on ordinary navigation', () => {
    renderLayout(['/']);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  it('does not steal focus when navigation state exists without the focus marker', () => {
    renderLayout([{ pathname: '/', state: { from: { pathname: '/deals' } } }] as Entry);

    expect(screen.getByRole('main')).not.toHaveFocus();
  });

  // `focusMain` stays on the history entry, so returning to it must not re-run the hand-off.
  it('does not steal focus back when the landing entry is revisited', () => {
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/', state: { focusMain: true } }] as Entry}
        future={ROUTER_FUTURE_FLAGS}
      >
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<NavigationProbe />} />
            <Route path="/deals" element={<div>deals page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const main = screen.getByRole('main');

    expect(main).toHaveFocus();

    act(() => navigate?.('/deals'));
    act(() => main.blur());

    expect(main).not.toHaveFocus();

    act(() => navigate?.(-1));

    expect(screen.getByText('probe')).toBeInTheDocument();
    expect(main).not.toHaveFocus();
  });
});
